
(defmacro values [obj]
  `(js! "Object.values" ~obj))
(defmacro keys [obj]
  `(js! "Object.keys" ~obj))

(defmacro whatis? [obj]
  `(js! "Object.prototype.toString.call" ~obj))

(defmacro regexs [pattern glim] `(new RegExp ~pattern ~glim))
(defmacro regex [pattern] `(new RegExp ~pattern))

(defmacro undef? [obj]
  `(= (typeof? ~obj) "undefined"))
(defmacro boolean? [obj]
  `(= (typeof? ~obj) "boolean"))
(defmacro number? [obj]
  `(= (typeof? ~obj) "number"))
(defmacro string? [obj]
  `(= (typeof? ~obj) "string"))
(defmacro fn? [obj]
  `(= (typeof? ~obj) "function"))

(defmacro date? [obj]
  `(= (whatis? ~obj) "[object Date]"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro regex? [obj]
  `(= (whatis? ~obj) "[object RegExp]"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro array? [obj]
  `(= (whatis? ~obj) "[object Array]"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro object? [obj]
  `(= (whatis? ~obj) "[object Object]"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro null? [obj]
  `(= (whatis? ~obj) "[object Null]"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro isdef? [obj] `(not (undef? ~obj)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro assert [cond msg]
  `(if-not ~cond (throw (new Error ~msg))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro true? [obj] `(= true ~obj))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro false? [obj] `(= false ~obj))


(defmacro not [x] `(if ~x false true))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro when-not [cond & xs] `(when (not ~cond) ~@xs))
(defmacro unless [cond &xs] `(when-not ~cond ~@xs))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro if-not [cond & xs]
  (let* [e1 (nth rest 0)
         e2 (nth rest 1)]
    `(if (not ~cond) ~e1 ~e2)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro when [cond & xs] `(if ~cond (do ~@xs)))

(defmacro cond [& xs]
  (assert (even? (count xs)))
  (if (> (count xs) 0)
    (list 'if
          (nth xs 0)
          (nth xs 1)
          (cons 'cond (rest (rest xs))))))

(defmacro -> [expr form & xs]
  (if (> (count xs) 0)
    `(-> (~(nth form 0) ~expr ~@(rest form)) ~@xs)
    `(~(nth form 0) ~expr ~@(rest form))))

(defmacro ->> [expr form & xs]
  (if (> (count xs) 0)
    `(->> (~@form ~expr) ~@xs)
    `(~@form ~expr)))

(defmacro while [cond & xs]
  `(let* [f (fn* [] ~@xs)
          r (fn* []
               (if ~cond
                 (do (f) (r))))]
    (r)))


(defmacro loop [bindings &xs]
  (let*
    [es (evens bindings)
     os (odds bindings)
     func
      `(fn* []
         (let* [recur nil ____xs nil
                ____f (fn* [ ~@es  ] ~@xs)
                ____ret ____f]
           (def! recur
             (fn* []
                (def! ____xs arguments)
                (when (isdef? ____ret)
                  (def! ____ret undefined)
                  (while (undef? ____ret)
                    (def! ____ret
                      (.apply ____f this ____xs)))
                  ____ret)))
           (recur ~@os)))]
    (func)))


(defmacro or [&xs]
  (let* [cvar (gensym)]
    (if (empty? xs)
      nil
      `(let* [~cvar ~(first xs)]
         (if ~cvar ~cvar (or ~@(rest xs)))))))

(defmacro and [&xs]
  (let* [cvar (gensym)]
    (if (empty? xs)
      `(= 1 1)
      `(let* [~cvar ~(first xs)]
        (if ~cvar
          (and ~@(rest xs))
          ~cvar)))))

(defmacro do-with [binding & xs]
  `(let* [~(first binding)
          ~(nth binding 1)]
    (do ~@xs ~(first binding))))

(defmacro do->false [&xs] `(do ~@xs (= 1 0)))
(defmacro do->true [&xs] `(do ~@xs (= 1 1)))
(defmacro do->nil [&xs] `(do ~@xs nil))
(defmacro do->undef [&xs] `(do ~@xs undefined))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro dotimes [binding &xs]
  (let [_times (gensym)]
    `(loop [~(first binding) 0
            ~_times ~(nth binding 1)]
       (when (> ~_times ~(first binding))
         ~@xs
         (recur (inc ~(first binding)) ~_times)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro if-some [binding then otherwise]
  `(let* [~(first binding) ~(nth binding 1)]
     (if (some? ~(first binding)) ~then ~otherwise)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro when-some [binding &xs]
  `(let* [~(first binding) ~(nth binding 1)]
     (when (some? ~(first binding)) ~@xs)))

(defmacro doto [target & xs]
  (let* [cvar (gensym)]
    `(let* [~cvar ~target] ~@xs ~cvar)))





;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

