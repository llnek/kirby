(require (fs "fs")
         (ast "./ast"))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(def chars-whitespace " \n\t\r")
(def chars-special "(){}[],@'`:")
(def chars-delim (str chars-whitespace chars-special ";"))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn in [str char]
  (number? (vector-find str char)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn vec-getter [i]
  (fn [vec]
    (vector-ref vec i)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn read [src]
  (var index 0)
  (var len (vector-length src))
  (var lineno 0)
  (var colno 0)
  (var current
       (fn []
         (if (finished)
           ""
           (vector-ref src index))))
  (var previous
       (fn []
         (vector-ref src (- index 1))))
  (var forward
       (fn []
         (set! index (+ index 1))
         (if (= (previous) "\n")
           (do (set! lineno (+ lineno 1))
               (set! colno 0))
           (set! colno (+ colno 1)))))
  (var back
       (fn []
         (set! index (- index 1))
         (if (= (current) "\n")
           (set! lineno (- lineno 1)))))
  (var finished
       (fn []
         (>= index len)))
  (var skip-whitespace
       (fn []
         (loop []
           (if (in chars-whitespace (current))
             (do (forward)
                 (recur))))))
  (var parse-string
       (fn [lineno colno]
         (loop [s ""]
           (forward)
           (cond
             (= (current) "\\")
             (do
               (forward)
               (recur
                 (str s
                      (let [c (current)]
                        (cond
                          (= c "n") "\n"
                          (= c "t") "\t"
                          (= c "r") "\r"
                          :else c)))))
             (= (current) "\"")
             (make-token 'STRING s lineno colno)
             :else (recur (str s (current)))))))
  (var parse-token
       (fn [s lineno colno]
         (cond
           (.match s (regex "^[-+]?[0-9]+$"))
           (make-token 'INTEGER s lineno colno)
           (.match s (regex "^[-+]?[0-9]+\\.[0-9]*$"))
           (make-token 'FLOAT s lineno colno)
           (.match s (regex "^[-+]?0x"))
           (let [m (.match s (regex "0x([0-9a-fA-F]+)$"))
                 px (if (= (vector-ref s 0) "-") "-" "")]
             (if m
               (make-token 'HEX
                           (str px (vector-ref m 1))
                           lineno colno)
               (traps! (str "invalid hex value: " s))))
           (or (= s "#f") (= s "#t"))
           (make-token 'BOOLEAN s lineno colno)
           :else
           (make-token 'SYMBOL s lineno colno))))
  (var parse-comment
       (fn [lineno colno]
         (loop [s ""]
           (forward)
           (if (or (finished)
                   (= (current) "\n"))
             (make-token 'COMMENT s lineno colno)
             (recur (str s (current)))))))
  ;; create a unique reference to disambiguate internal objects in the
  ;; reader
  (var unique-obj (list #t))
  (var make-token
       (fn [type data lineno colno]
         [unique-obj type data lineno colno]))
  (var token-type (vec-getter 1))
  (var token-data (vec-getter 2))
  (var token-lineno (vec-getter 3))
  (var token-colno (vec-getter 4))
  (var token?
       (fn [tok]
         (and (vector? tok)
              (= (vector-ref tok 0) unique-obj))))
  (var get-token
       (fn []
         (skip-whitespace)
         (let [c (current) lineno lineno colno colno]
           (cond
             (in chars-special c)
             (do (forward)
                 (make-token 'SPECIAL c lineno colno))
             (= c "\"")
             (let [s (parse-string lineno colno)]
                (forward)
                s)
             (= c ";")
             (parse-comment lineno colno)
             (= c "") #f
             (finished) #f
             :else
             (loop [s ""]
               (if (or (in chars-delim (current))
                       (finished))
                 (parse-token s lineno colno)
                 (do (forward)
                     (recur (str s (previous))))))))))
  ;; parser
  (var token->exp
       (fn [token]
         (let [type (token-type token)
               data (token-data token)]
           (cond
             (= type 'STRING) data
             (= type 'SYMBOL) (string->symbol data)
             (= type 'BOOLEAN) (if (= data "#f") #f #t)
             (= type 'INTEGER) (parseInt data)
             (= type 'FLOAT) (parseFloat data)
             (= type 'HEX) (parseInt data 16)
             :else
             (traps! (str "cannot convert token to exp: "
                          token))))))

  (var special?
       (fn [t chars]
         (and (token? t)
              (= (token-type t) 'SPECIAL)
              (in chars (token-data t)))))

  (var compound-start?
       (fn [t] (or (special? t "(")
                   (special? t "[")
                   (special? t "{"))))

  (var compound-end?
       (fn [t] (or (special? t ")")
                   (special? t "]")
                   (special? t "}"))))

  (var end?
       (fn [t] (and (token? t)
                    (= (token-type t) 'END))))

  (var read-exp
       (fn []
         (let [token (get-token)]
           (cond
             (not token)
             (make-token 'END #f #f #f)
             (compound-end? token) token
             ;; we simply return the token so the list/vector/dict loop
             ;; knows when to end
             (compound-start? token)
             (loop [lst '()
                    exp (read-exp)]
               (if (or (end? exp)
                       (compound-end? exp))
                 (do
                   ;; the loop will only break when it hits the end of
                   ;; file or an end delimiter, so we check the current
                   ;; character and move forward
                   (var in-list? (special? token "("))
                   (var in-vector? (special? token "["))
                   (var in-dict? (special? token "{"))
                   (cond
                     (and in-list?
                          (special? exp ")"))
                     (ast.make-node 'LIST (reverse lst)
                                    (token-lineno token)
                                    (token-colno token))
                     (and in-vector?
                          (special? exp "]"))
                     (ast.make-node 'VECTOR (reverse lst)
                                    (token-lineno token)
                                    (token-colno token))
                     (and in-dict?
                          (special? exp "}"))
                     (ast.make-node 'DICT (reverse lst)
                                    (token-lineno token)
                                    (token-colno token))
                     :else
                     (traps! (str "unterminated "
                                  (cond
                                    list? "list"
                                    vector? "vector"
                                    dict? "dict")))))
                 (do
                   (recur (cons exp lst)
                          (read-exp)))))
             (special? token "'")
             (ast.make-node
               'LIST
               (list (ast.make-node
                       'ATOM 'quote
                       (token-lineno token)
                       (token-colno token))
                     (read-exp))
               (token-lineno token)
               (token-colno token))
             (special? token ":")
             (let [e (read-exp)]
               (if (or (not (ast.atom? e))
                       (not (symbol? (ast.node-data e))))
                 (traps! (str "invalid key expr: "
                              (ast.node-data e))))
               (ast.make-node
                 'ATOM
                 (symbol->key (ast.node-data e))
                 (token-lineno token)
                 (token-colno token)))
             (special? token "`")
             (ast.make-node
               'LIST
               (list (ast.make-node
                       'ATOM
                       'quasiquote
                       (token-lineno token)
                       (token-colno token))
                     (read-exp))
               (token-lineno token)
               (token-colno token))
             (special? token ",")
             (let [next (current)]
               (if (= next "@")
                 (do
                   (forward)
                   (ast.make-node
                     'LIST
                     (list (ast.make-node
                             'ATOM
                             'unquote-splicing
                             (token-lineno token)
                             (token-colno token))
                           (read-exp))
                     (token-lineno token)
                     (token-colno token)))
                 (do
                   (ast.make-node
                     'LIST
                     (list (ast.make-node
                             'ATOM
                             'unquote
                             (token-lineno token)
                             (token-colno token))
                           (read-exp))
                     (token-lineno token)
                     (token-colno token)))))
             :else
             (if (= (token-type token) 'COMMENT)
               (read-exp)
               (ast.make-node
                 'ATOM
                 (token->exp token)
                 (token-lineno token)
                 (token-colno token)))))))
  (loop [e* '()
         e (read-exp)]
    (if (end? e)
      (if (= (length e*) 1)
        (car e*)
        (ast.make-node
          'LIST
          (cons (ast.make-node 'ATOM 'begin 0 1)
                (reverse e*))
          0 0))
      (recur (cons e e*) (read-exp)))))

(set! module.exports {:read read})

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

