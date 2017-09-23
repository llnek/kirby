function regexs(s,glim) { return new RegExp(s,glim); }
function regex(s) { return new RegExp(s); }
var REGEX= {
  noret: regex("^def\\b|^var\\b|^set!\\b|^throw\\b"),
  id: regex("^[a-zA-Z_$][?\\-*!0-9a-zA-Z_'<>#@$]*$"),
  id2: regex("^[*\\-][?\\-*!0-9a-zA-Z_'<>#@$]+$"),
  float: regex("^[-+]?[0-9]+\\.[0-9]+$"),
  int: regex("^[-+]?[0-9]+$"),
  hex: regex( "^[-+]?0x"),
  macroGet: regex("^#slice@(\\d+)"),
  dquoteHat: regex( "^\""),
  dquoteEnd: regex( "\"$"),
  func: regex( "^function\\b"),
  query: regexs( "\\?","g"),
  bang: regexs( "!","g"),
  dash: regexs( "-","g"),
  quote: regexs( "'", "g"),
  hash: regexs( "#", "g"),
  at: regexs( "@", "g"),
  less: regexs( "<", "g"),
  greater: regexs( ">", "g"),
  star: regexs( "\\*","g"),
  wspace: regex( "\\s") };

var RESERVED= {
compare: ["!=","==","=",">",">=","<","<="],
   arith: ["+","-","*","/","%"],
   logic: ["||","&&"],
   bitwise: ["^","&","|","<<",">>",">>>"],
   incdec: ["++","--"],
   unary: ["~","!"],
   assign: ["+=","-=","*=",
             "/=", "%=", "<<=",
             ">>=", ">>>=", "&=", "|=", "^="],
   builtin: ["quote","syntax-quote","quasi-quote",
              "backtick", "unquote", "unquote-splice",
              "repeat-n","do","doto","case",
              "range", "def-", "def", "var",
              "new", "throw", "while", "lambda",
              "inst?", "delete!",
              "aset", "set!", "fn",
              "defn-", "defn",
              "try", "if", "get", "aget", "str",
              "list", "[", "vec", "{", "hash-map",
              "ns", "comment", "for", "cons",
              "js#", "macro", "defmacro"]};

var RESERVEDKEYS
  (-> (reduce (fn [acc x]
                (.concat acc x))
              []
              (values *reserved*))
      (zipmap [])))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(def- tkn-string "STRING")
(def- tkn-number "NUMBER")
(def- tkn-symbol "SYMBOL")
(def- tkn-ident "IDENT")
(def- tkn-atom "ATOM")
(def- tkn-hat "HAT")
(def- tkn-meta "HAT-META")
(def- tkn-ns "NS")
(def- tkn-quote "QUOTE")
(def- tkn-back-tick "BACKTICK")
(def- tkn-list "LIST")
(def- tkn-tree "TREE")
(def- tkn-map "MAP")
(def- tkn-vector "VECTOR")
(def- tkn-array "ARRAY")
(def- tkn-object "OBJECT")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro name?? [obj] (get?? ~obj :name ""))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- nodeTag [obj src line col type]
  (when obj
    (set! obj :source src)
    (set! obj :column col)
    (set! obj :line line)
    (set! obj :isMeta false)
    (set! obj :eTYPE type)) obj)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- testid? [name]
  (or (REGEX.id.test name) (REGEX.id2.test name)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- jsid [name] (normalizeId name))
(defn- normalizeId [name]
  (var pfx "")
  (when (and (string? name)
             (= "-" (.charAt name 0)))
    (set! pfx "-")
    (set! name (.slice name 1)))
  (if (testid? name)
    (-> (str pfx name)
        (.replace REGEX.query "_QUERY")
        (.replace REGEX.bang "_BANG")
        (.replace REGEX.dash "_")
        (.replace REGEX.quote "_QTE")
        (.replace REGEX.hash "_HASH")
        (.replace REGEX.at "_AT")
        (.replace REGEX.less "_LT")
        (.replace REGEX.greater "_GT")
        (.replace REGEX.star "_STAR"))
    (if (= pfx "") name (str pfx name))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;use this function to generate code, we need to escape out funny
;;chars in names
(defn- tnodeString []
  (var me this)
  (do-with [s ""]
    (.walk me
           (fn [chunk hint]
             (if (and (= hint.name chunk)
                      (string? chunk))
               (set! chunk (normalizeId chunk)))
             (+= s chunk)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- tnode [source line col chunk name type]
  (var args? (js-args?))
  (do-with [n nil]
    (if args?
      (set! n
            (if name
              (new TreeNode line col source chunk name)
              (new TreeNode line col source chunk)))
      (set! n (new TreeNode)))
    (set! n :isMeta false)
    (set! n :eTYPE type)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- tnodeEx [chunk name type]
  (tnode nil nil nil chunk name type))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- addToken [tree token ctx]
  (var n nil t tkn-symbol)
  (do-with [ret ""]
    (when token
      (if (= ":else" token) (set! token "true"))
      (if (= "nil" token) (set! token "null"))
      (cond
        (and (.startsWith token "\"")
             (.endsWith token "\""))
        (set! t tkn-string)
        (or (REGEX.float.test token)
            (REGEX.int.test token)
            (REGEX.hex.test token))
        (set! t tkn-number)
        (= "`" token)
        (set! t tkn-back-tick)
        (.startsWith token ":")
        (set! token (str "\"" (.slice token 1) "\""))
        (.startsWith token "'")
        (set! token (str "\"" (.slice token 1) "\""))
        :else
        (set! t tkn-ident))
      (when (= tkn-ident t)
        (if-not (and (empty? tree)
                     (contains? *reserved-keys* token))
          (set! token (normalizeId token))))
      (set! n (tnode ctx.file
                     ctx.line
                     (dec ctx.tcol) token token t))
      (conj!! tree n))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- lexer [prevToken ctx]
  (var ____BREAK! nil
       formType nil
       token ""
       ch nil
       nxch nil
       escStr? false
       inStr? false
       comment? false)

  (set! prevToken (or prevToken ""))
  (do-with [tree []]
    (nodeTag tree
             (get ctx :source)
             (get ctx :line)
             0
             (cond
               (.endsWith prevToken "{") tkn-object
               (= "[" prevToken) tkn-array
               :else tkn-list))
    (if (.startsWith prevToken "^")
      (set! tree :isMeta true))
    (set! ____BREAK! false)
    (while (and (not ____BREAK!)
                (< ctx.pos (alen ctx.codeStr)))
      (set! ch (.charAt ctx.codeStr ctx.pos))
      (++ ctx.colno)
      (++ ctx.pos)
      (set! nxch (.charAt ctx.codeStr ctx.pos))
      (when (= ch "\n")
        (++ ctx.lineno)
        (set! ctx.colno 1)
        (if comment? (toggle! comment?)))
      (cond
        comment?
        nil
        escStr?
        (do (toggle! escStr?)
            (+= token ch))
        (= ch "\"")
        (do (toggle! inStr?)
            (+= token ch))
        inStr?
        (do (if (= ch "\n") (set! ch "\\n"))
            (if (= ch "\\") (set! escStr? true))
            (+= token ch))
        (= ch "'")
        (+= token ch)
        (or (= ch "[")
            (= ch "]"))
        (do (set! token (addToken tree token ctx))
            (set! ctx.tcol ctx.colno)
            (if (= ch "[")
              (do (set! formType tkn-array)
                  (conj!! tree (lexer ch ctx)))
              (do (set! formType nil)
                  (set! ____BREAK! true))))
        (or (= ch "{")
            (= ch "}"))
        (do (set! token (addToken tree token ctx))
            (set! ctx.tcol ctx.colno)
            (if (= ch "{")
              (do (set! formType tkn-object)
                  (conj!! tree (lexer ch ctx)))
              (do (set! formType nil)
                  (set! ____BREAK! true))))
        (= ch ";")
        (set! comment? true)
        (= ch "^")
        (if (REGEX.wspace.test nxch)
          (do (+= token ch)
              (set! token (addToken tree token ctx)))
          (do (set! token (addToken tree token ctx))
              (if (not= "{" nxch) (syntax! :e0 tree))
              (++ ctx.pos)
              (set! ctx.tcol ctx.colno)
              (set! formType tkn-object)
              (conj!! tree (lexer "^{" ctx))))
        (or (= ch "(")
            (= ch ")"))
        (do (set! token (addToken tree token ctx))
            (set! ctx.tcol ctx.colno)
            (if (= ch "(")
              (do (set! formType tkn-list)
                  (conj!! tree (lexer ch ctx)))
              (do (set! formType nil)
                  (set! ____BREAK! true))))
        (REGEX.wspace.test ch)
        (do (if (= ch "\n") (-- ctx.lineno))
            (set! token (addToken tree token ctx))
            (if (= ch "\n") (++ ctx.lineno))
            (set! ctx.tcol ctx.colno))
        :else
        (+= token ch)))
    ;;final check!
    (if inStr? (syntax! 'e3 tree))
    (case formType
      tkn-array (syntax! 'e5 tree)
      tkn-object (syntax! 'e7 tree)
      tkn-list (syntax! 'e8 tree))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- throwE [token msg]
  (throw (new Error
              (if token
                (str msg
                     "\nnear line " token.line
                     "\nin file " token.source)
                (str msg "\nnear EOF ")))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- nextToken [tokens]
  (do-with [t (nth tokens
                   tokens.pos)] (++ tokens.pos)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- peekToken [tokens] (nth tokens tokens.pos))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- atom [v] (new Atom v))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- symbol [s] (new Symbol s))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- keyword [k] (new Keyword k))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- copyTokenData [token node]
  (when node
    (set! node "source" (get token "source"))
    (set! node "line" (get token "line"))
    (set! node "column" (get token "column")))
  node)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- readAtom "" [tokens]
  (var token (nextToken tokens)
       tn (or (if token (.-name token)) ""))
  (->> (cond
         (empty? tn) undefined
         (REGEX.float.test tn) (atom (parseFloat tn))
         (or (REGEX.hex.test tn)
             (REGEX.int.test tn)) (atom (parseInt tn))
         (and (.startsWith tn  "\"")
              (.endsWith tn "\"")) (atom tn)
         (.startsWith tn ":") (keyword (.slice tn 1))
         (or (= "nil" tn)
             (= "null" tn)) (atom null)
         (= "true" tn) (atom true)
         (= "false" tn) (atom false)
         :else (symbol tn))
       (copyTokenData token )))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- readBlock [tokens head tail]

  (var token (nextToken tokens)
       tn (if token (.-name token)))

  (if (not= tn head)
    (throwE token (str "expected '" head "'")))

  (do-with
    [ret
     (loop [ast []
            cur (peekToken tokens)]
       (if (or (nichts? cur)
               (= tail (.-name cur)))
         (if cur
           (copyTokenData token ast)
           (throwE cur (str "expected '" tail "', got EOF")))
         (recur (addAst ast
                        (readTokens tokens))
                (peekToken tokens))))]
    (nextToken tokens)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- readList [cur tokens]
  (do-with [v (readBlock tokens "(" ")")]
           (set! v "eTYPE" tkn-list)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- readVector [cur tokens]
  (do-with [v (readBlock tokens "[" "]")]
           (set! v "eTYPE" tkn-vector)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- readObject [cur tokens]
  (do-with [v (readBlock tokens "{"  "}")]
    (if (odd? (count v))
      (throwE cur "expected even count in map"))
    (set! v "eTYPE" tkn-map)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- skipAndParse [tokens func]
  (var cur (nextToken tokens))
  (copyTokenData cur (func tokens)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- readTokens [tokens]
  (var tmp nil
       token (peekToken tokens))
  (when (some? token)
    (case (.-name token)
      "'" (skipAndParse tokens
                        (# [(symbol "quote")
                            (readTokens tokens)]))
      ;--
      "`" (skipAndParse tokens
                        (# [(symbol "backtick")
                            (readTokens tokens)]))
      ;--
      "~" (skipAndParse tokens
                        (# [(symbol "unquote")
                            (readTokens tokens)]))
      ;--
      "~@" (skipAndParse tokens
                         (# [(symbol "splice-unquote")
                             (readTokens tokens)]))
      ;--
      "^" (skipAndParse tokens
                        (# (set! tmp (readTokens tokens))
                           [(symbol "with-meta")
                            (readTokens tokens) tmp]))
      ;--
      "@" (skipAndParse tokens
                        (# [(symbol "deref")
                            (readTokens tokens)]))
      ;--
      ")" (throwE token "unexpected ')'")
      "(" (readList token tokens)
      ;--
      "]" (throwE token "unexpected ']'")
      "[" (readVector token tokens)
      ;--
      "}" (throwE token "unexpected '}'")
      "{" (readObject token tokens)
      ;--
      (";" ",") (do->undef (nextToken tokens))
      ;--
      (readAtom tokens))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- addAst "" [ast f]
  (if (def? f) (.push ast f)) ast)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- parser "" [source fname]
  (var tokens (tokenize source fname)
       tlen (count tokens))
  (set! tokens "pos" 0)
  (do-with [ast []]
    (loop [f (readTokens tokens)]
      (addAst ast f)
      (if-not (< (.-pos tokens) tlen)
        ast
        (recur (readTokens tokens))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- tokenize "" [source fname]
  (var len (count source)
       token ""
       line 1
       tcol 0
       col 0
       pos 0
       ch nil
       nx nil
       esc? false
       str? false
       comment? false)

  (do-with [tree []]
    (var toke! (fn [ln col s]
                 (if s
                   (.push tree
                          (tnode fname ln col s s))) ""))
    (while (< pos len)
      (set! ch (.charAt source pos))
      (++ col)
      (++ pos)
      (set! nx (.charAt source pos))
      (when (= ch "\n")
        (set! col 0)
        (++ line)
        (if comment? (toggle! comment?)))
      (cond
        ;--
        comment?
        nil
        ;--
        esc?
        (do (toggle! esc?)
            (+= token ch))
        ;--
        (= ch "\"")
        (if-not str?
          (do (set! tcol col)
              (toggle! str?)
              (+= token ch))
          (do (toggle! str?)
              (+= token ch)
              (set! token (toke! line tcol token))))
        ;--
        str?
        (do (if (= ch "\n") (set! ch "\\n"))
            (if (= ch "\\") (set! esc? true))
            (+= token ch))
        ;--
        (or (= ch "'") (= ch "`")
            (= ch "@") (= ch "^"))
        (if (and (empty? token)
                 (not (REGEX.wspace.test nx)))
          (do (set! tcol col)
              (toke! line tcol ch))
          (+= token ch))
        ;--
        (= ch "~")
        (if (and (empty? token)
                 (not (REGEX.wspace.test nx)))
          (do (set! tcol col)
              (if (= nx "@")
                (do (++ pos)
                    (toke! line tcol "~@"))
                (toke! line tcol ch)))
          (+= token ch))
        ;--
        (or (= ch "[") (= ch "]")
            (= ch "{") (= ch "}")
            (= ch "(") (= ch ")"))
        (do (set! token (toke! line tcol token))
            (set! tcol col)
            (toke! line tcol ch))
        ;--
        (= ch ";")
        (do (set! token (toke! line tcol token))
            (set! tcol col)
            (set! comment? true))
        ;-- comma treated as whitespace
        (or (= ch ",")
            (REGEX.wspace.test ch))
        (set! token
              (toke! (if (= ch "\n")
                          (dec line) line) tcol token))
        :else
        (do (when (empty? token) (set! tcol col))
            (+= token ch))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- dumpTree [tree]
  (var obj nil
       indent (or (nth arguments 1) 0)
       pad (.repeat " " indent))
  (for ((i 0)
        (< i (count tree)) (i (inc i)))
    (set! obj (nth tree i))
    (println (pr__str obj))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- ast-keyword? [obj] (inst? Keyword obj))
(defn- ast-symbol? [obj] (inst? Symbol obj))
(defn- ast-list? [obj] (and (array? obj)
                            (or (= tkn-list (.-eTYPE obj))
                                (undef? (.-eTYPE obj)))))
(defn- ast-vector? [obj] (and (array? obj)
                              (= tkn-vector (.-eTYPE obj))))
(defn- ast-map? [obj] (and (array? obj)
                         (= tkn-map (.-eTYPE obj))))
(defn- ast-object? [obj] (and (not (array? obj))
                              (not (fn? obj))
                              (object? obj)))
(defn- ast-nil? [obj] (and (atom? obj)
                           (null? (.-value obj))))
(defn- ast-number? [obj] (and (atom? obj)
                              (number? (.-value obj))))
(defn- ast-string? [obj] (and (atom? obj)
                              (string? (.-value obj))))
(defn- ast-true? [obj] (and (atom? obj)
                            (true? (.-value obj))))
(defn- ast-false? [obj] (and (atom? obj)
                             (false? (.-value obj))))
(defn- ast-fn? [obj] (fn? obj))

(defn- atom? [obj] (inst? Atom obj))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- tnodeType [obj]
  (var v (if obj (.-value obj)))
  (cond
    (ast-keyword? obj) "keyword"
    (ast-symbol? obj) "symbol"
    (ast-list? obj) "list"
    (ast-vector? obj) "vector"
    (ast-object? obj) "object"
    (ast-map? obj) "map"
    (ast-nil? obj) "nil"
    (ast-number? obj) "number"
    (ast-string? obj) "string"
    (ast-true? obj) "true"
    (ast-false? obj) "false"
    (atom? obj) "atom"
    (ast-fn? obj) "function"
    :else
    (trap! (str "Unknown type '" (whatis? obj) "'"))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- pr__str [obj readable?]
  (if (undef? readable?) (set! readable? true))
  (var ot (tnodeType obj) r? readable?)
  (case ot
    "list"
    (str "(" (-> (map (fn [e]
                        (pr__str e r?)) obj) (.join " ")) ")")
    "vector"
    (str "[" (-> (map (fn [e]
                        (pr__str e r?)) obj) (.join " ")) "]")
    "map"
    (str "{" (-> (map (fn [e]
                        (pr__str e r?)) obj) (.join " ")) "}")
    "object"
    (str "{" (-> (reduce
                   (fn [acc k]
                     (.push acc
                            (pr__str k r?)
                            (pr__str (get obj k) r?))
                     acc) [] (keys obj))
                 (.join " ")) "}")
    "keyword"
    (str ":" (.-value obj))
    "symbol"
    (.-value obj)
    "atom"
    (str "(atom " (pr__str (.-value obj) r?) ")")
    (if obj (.toString obj) "nil")))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn- println []
  (console.log.apply console arguments))








