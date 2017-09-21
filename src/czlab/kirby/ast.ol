;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn vec-getter "" [i]
  (fn [vec]
    (vector-ref vec i)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(def unique-obj (list #f))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn make-node "" [type data lineno colno]
  [unique-obj type data #f lineno colno])
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn make-node-extra "" [type data extra lineno colno]
  [unique-obj type data extra lineno colno])
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn copy-node [node data]
  (make-node-extra (node-type node)
                   data
                   (node-extra node)
                   (node-lineno node)
                   (node-colno node)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(def node-type (vec-getter 1))
(def node-data (vec-getter 2))
(def node-extra (vec-getter 3))
(def node-lineno (vec-getter 4))
(def node-colno (vec-getter 5))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn trap! "" [msg]
  (throw (new Error msg)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn assert-node "" [node]
  (when-not (and (vector? node)
                 (= (vector-ref node 0) unique-obj))
    (pp node)
    (trap! "not a node")))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn assert-type "" [node type]
  (if (not= (node-type node) type)
    (trap! (str "expected node type " type ": " node))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn is-type? "" [node type]
  (assert-node node)
  (= (node-type node) type))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn is-atom? "" [node]
  (or (is-type? node 'ATOM)
      (and (is-type? node 'LIST)
           (nil? (node-data node)))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn is-list? "" [node]
  (and (is-type? node 'LIST)
       (not (nil? (node-data node)))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn is-vector? "" [node] (is-type? node 'VECTOR))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn is-dict? "" [node] (is-type? node 'DICT))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn is-empty-list? "" [node]
  (and (is-type? node 'LIST)
       (nil? (node-data node))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn make-atom "" [type parent]
  (make-node 'ATOM type
             (node-lineno parent)
             (node-colno parent)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn make-list "" [children] ;[. children]
  (make-list* children))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn make-list* "" [children]
  (let [first (car children)]
    (make-node 'LIST children
               (node-lineno first)
               (node-colno first))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn make-empty-list "" [parent]
  (make-node 'LIST '()
             (node-lineno parent)
             (node-colno parent)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn prepend "" [node lst]
  (make-node 'LIST
             (cons node (node-data lst))
             (node-lineno node)
             (node-colno node)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn map-children "" [func lst]
  (make-node 'LIST
             (map func (node-data lst))
             (node-lineno lst)
             (node-colno lst)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn first "" [node]
  (car (node-data node)))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defn first* "" [node]
  (node-data (car (node-data node))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(set! module.exports {:make-node make-node
                      :make-node-extra make-node-extra
                      :copy-node copy-node
                      :node-type node-type
                      :node-data node-data
                      :node-extra node-extra
                      :node-lineno node-lineno
                      :node-colno node-colno
                      :type? is-type?
                      :atom? is-atom?
                      :list? is-list?
                      :vector? is-vector?
                      :dict? is-dict?
                      :empty-list? is-empty-list?

                      :make-list make-list
                      :make-list* make-list*
                      :make-empty-list make-empty-list
                      :make-atom make-atom
                      :prepend prepend
                      :map-children map-children
                      :first first
                      :first* first*})
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF


