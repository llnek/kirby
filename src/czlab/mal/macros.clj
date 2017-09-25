
(defmacro whatis? [obj]
  `(js! "Object.prototype.toString.call" ~obj))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro assert [cond msg]
  `(if-not ~cond (throw (new Error ~msg))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro regexs [pattern glim] `(new RegExp ~pattern ~glim))
(defmacro regex [pattern] `(new RegExp ~pattern))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
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

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
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
(defmacro true? [obj] `(= true ~obj))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro false? [obj] `(= false ~obj))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro values [obj]
  `(js! "Object.values" ~obj))
(defmacro keys [obj]
  `(js! "Object.keys" ~obj))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro when-not [cond & rest] `(when (not ~cond) ~@rest))
(defmacro unless [cond &rest] `(when-not ~cond ~@rest))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro if-not [cond & rest]
  (let* [e1 (nth rest 0)
         e2 (nth rest 1)]
    `(if (not ~cond) ~e1 ~e2)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro when [cond & rest] `(if ~cond (do ~@rest)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro cond [&rest]
  `(if (#<< &rest)
     (#<< &rest)
     (#if &rest (cond ~&rest))))

(defmacro cond [& xs]
  (assert (even? (count xs)))
  (if (> (count xs) 0)
    (list 'if
          (nth xs 0)
          (nth xs 1)
          (cons 'cond (rest (rest xs))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro -> [func form &rest]
  (#if &rest
     (-> ((#<< form) ~func ~@form) ~&rest)
     ((#<< form) ~func ~@form)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro ->> [func form &rest]
  (#if &rest
     (->> (~@form ~func) ~&rest)
     (~@form ~func)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro each [func coll] (.forEach ~coll ~func))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro reduce0 [func coll] (.reduce ~coll ~func))
(defmacro reduce [func start coll] (.reduce ~coll ~func ~start))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro map [func coll] (.map ~coll ~func))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro filter [func coll] (.filter ~coll ~func))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro some [func coll] (.some ~coll ~func))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro every? [func coll] (.every ~coll ~func))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro loop [bindings &rest]
  ((# (var recur nil
           ____xs nil
           ____f (fn [ (#evens* bindings) ] ~&rest)
           ____ret ____f)
      (set! recur
            (# (set! ____xs arguments)
               (when (def? ____ret)
                 (js# "for (____ret=undefined; ____ret===undefined; ____ret=____f.apply(this,____xs));")
                 ____ret)))
      (recur (#odds* bindings)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro template [name pms &rest]
  (def ~name (fn [ ~@pms ] (str ~&rest))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro template-repeat [coll &rest]
  (reduce
     (fn [____memo ____elem ____index ____coll]
      (str ____memo (str ~&rest))) "" ~coll))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro template-repeat-key [obj &rest]
  (do-with [____ret ""]
     (each-key
       (fn [value key]
         (set! ____ret (str ____ret (str ~&rest)))) ~obj)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro sequence [name args init &rest]
  (def ~name
     (fn [ ~@args ]
       ((# ~@init
           (var next nil
                ____curr 0
                ____actions (new Array ~&rest))
           (set! next
                 (# (var ne (get ____actions (++ ____curr)))
                    (if ne
                      ne
                      (throw "Call to (next) beyond sequence."))))
           ((next)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro assert-test [cond msg]
  (if ~cond
     (str "Passed - " ~msg)
     (str "Failed - " ~ms)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro test-group [name &rest]
  (var ~name (# [ ~&rest ])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro test-runner [groupname desc]
  ((fn [name dsc]
      (var start (new Date)
           tests (name) passed 0 failed 0)
      (each
        (fn [em]
          (if (.match em (new RegExp "^Passed"))
            (++ passed)
            (++ failed))) tests)
      (str
        (str "\n" dsc "\n" start "\n\n")
        (template-repeat tests ____elem "\n")
        "\nTotal tests " (alen tests)
        "\nPassed " passed
        "\nFailed " failed
        "\nDuration " (- (new Date) start) "ms\n")) ~groupname ~desc))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro m-identity []
  (hash-map
     bind (fn [mv mf] (mf mv))
     unit (fn [v] v)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro m-maybe []
  (hash-map
     bind (fn [mv mf] (if (nil? mv) nil (mf mv)))
     unit (fn [v] v)
     zero nil))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro m-array []
  (hash-map
     bind (fn [mv mf]
            (reduce
              (fn [accum val] (accum.concat val))
              []
              (map mv mf)))
     unit (fn [v] [v])
     zero []
     plus (# (reduce
               (fn [accum val] (accum.concat val))
               []
               (Array.prototype.slice.call arguments)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro m-state []
  (hash-map
     bind (fn [mv f]
            (fn [s]
              (var l (mv s)
                   v (get l 0)
                   ss (get l 1))
              ((f v) ss)))
     unit (fn [v] (fn [s] [v s]))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro m-continuation []
  (hash-map
     bind (fn [mv mf]
            (fn [c]
              (mv (fn [v] ((mf v) c)))))
     unit (fn [v]
            (fn [c] (c v)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro m-bind [binder bindings expr]
  (~binder (#slice@2 bindings)
    (fn [ (#<< bindings) ]
      (#if bindings
        (m-bind ~binder ~bindings ~expr)
        ((# ~expr))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro do-monad [monad bindings expr]
  ((fn [____m]
      (var ____u (fn [v]
                   (if (and (undef? v)
                            (def? ____m.zero))
                     ____m.zero
                     (____m.unit v))))
      (m-bind ____m.bind ~bindings (____u ~expr))) (~monad)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro defmonad [name obj] (def ~name (# ~obj)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro and [&rest] (&& ~&rest))
(defmacro or [&rest] (|| ~&rest))
(defmacro not [&rest] (! ~&rest))
(defmacro not= [&rest] (!= ~&rest))
(defmacro mod [&rest] (% ~&rest))
(defmacro nil? [&rest] (null? ~&rest))
(defmacro eq? [&rest] (== ~&rest))
(defmacro alen [arr] (.-length ~arr))
(defmacro eindex [arr] (- (.-length ~arr) 1))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro second [coll] (nth ~coll 1))
(defmacro third [coll] (nth ~coll 2))
(defmacro fourth [coll] (nth ~coll 3))
(defmacro first [coll] (nth ~coll 0))

(defmacro car "index 0" [coll] (first ~coll))
(defmacro cdr [c] (drop ~c 1))
(defmacro cadr "index 1" [coll] (second ~coll))
(defmacro caddr "index 2" [coll] (third ~coll))
(defmacro cadddr "index 3" [coll] (fourth ~coll))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;(defmacro bit-and [&rest] (& ~&rest))
;(defmacro bit-or [&rest] (| ~&rest))
;(defmacro bit-xor [&rest] (^ ~&rest))

(defmacro bit-shift-right-zero [&rest] (>>> ~&rest))
(defmacro bit-shift-right [&rest] (>> ~&rest))
(defmacro bit-shift-left [&rest] (<< ~&rest))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro # [&rest] (fn [] ~&rest))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro inc [x] (+ ~x 1))
(defmacro dec [x] (- ~x 1))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro try! [&rest] (try ~&rest (catch ____error undefined)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro let* [bindings expr]
  (do-monad m-identity ~bindings ~expr))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro let [bindings &rest]
  (do (var ~@bindings) ~&rest))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro do-with
  [binding &rest]
  (let ~binding (do ~&rest (#head binding))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro do->false [&rest] (do ~&rest false))
(defmacro do->true [&rest] (do ~&rest true))
(defmacro do->nil [&rest] (do ~&rest nil))
(defmacro do->undef [&rest] (do ~&rest undefined))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro dotimes [binding &rest]
  (loop ((#head binding) 0
          ____times (#tail binding))
     (when (> ____times (#head binding))
       ~&rest
       (recur (inc (#head binding)) ____times))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro if-some [binding then else]
  (let [ ~@binding ]
     (if (some? (#head binding)) ~then ~else)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro when-some [binding &rest]
  (let [ ~@binding ]
     (when (some? (#head binding)) ~&rest)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro conj [c a] (.concat ~c [ ~a ]))
(defmacro concat [a b] (.concat ~a ~b))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro js-args? [] (> (alen arguments) 0))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro toggle! [x] (set! ~x (not ~x)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defmacro jsargs! [] (Array.prototype.slice.call arguments))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

