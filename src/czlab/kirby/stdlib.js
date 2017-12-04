/*Auto generated by Kirby - v1.0.0 czlab.kirby.stdlib Mon Dec 04 2017 03:43:50 GMT-0800 (PST)*/

////////////////////////////////////////////////////////////////////////////////
//name: [not-empty] in file: stdlib.ky near line: 13
//If coll is empty,
//returns nil, else coll
const not_DASH_empty = function(coll) {
  return ((0 === count(coll)) ?
    null :
    coll);
};
////////////////////////////////////////////////////////////////////////////////
//name: [stringify] in file: stdlib.ky near line: 19
//JSON stringify without
//circular object reference
const stringify = function(obj) {
  let cache = [];
  return (obj ?
    JSON.stringify(obj, function(k, v) {
      if (object_QUERY(v)) {
        if (contains_QUERY(cache, v)) {
          v = undefined;
        } else {
          conj_BANG(cache, v);
        }
      }
      return v;
    }) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//name: [opt??] in file: stdlib.ky near line: 32
//If cur is not defined,
//returns other else returns cur
const opt_QUERY__QUERY = function(cur, other) {
  return ((typeof (cur) !== "undefined") ?
    cur :
    other);
};
////////////////////////////////////////////////////////////////////////////////
//name: [conj!] in file: stdlib.ky near line: 38
//If coll is a list,
//prepends to head of coll else appends all to end
const conj_BANG = function(coll) {
  let xs = Array.prototype.slice.call(arguments, 1);
  if (list_QUERY(coll)) {
    coll.unshift.apply(coll, xs.reverse());
  } else {
    coll.push.apply(coll, xs);
  }
  return coll;
};
////////////////////////////////////////////////////////////////////////////////
//name: [conj] in file: stdlib.ky near line: 46
//Like conj! but
//returns a new collection
const conj = function(coll) {
  let xs = Array.prototype.slice.call(arguments, 1);
  let c = (vector_QUERY(coll) ?
    into("vector", coll) :
    (list_QUERY(coll) ?
      into("list", coll) :
      (map_QUERY(coll) ?
        into("map", coll) :
        (true ?
          Array.prototype.slice.call(coll) :
          null))));
  return conj_BANG.apply(this, [c].concat(xs));
};
////////////////////////////////////////////////////////////////////////////////
//name: [pop!] in file: stdlib.ky near line: 60
//Removes the first element if list,
//else removes the last element,
//returning the element
//and the altered collection
const pop_BANG = function(coll) {
  let r = (list_QUERY(coll) ?
    coll.shift() :
    coll.pop());
  return [r, coll];
};
////////////////////////////////////////////////////////////////////////////////
//name: [pop] in file: stdlib.ky near line: 68
//Like pop! but returns a new collection
const pop = function(coll) {
  let r = (list_QUERY(coll) ?
    coll[0] :
    last(coll));
  return [r,(list_QUERY(coll) ?
    coll.slice(1) :
    coll.slice(0, -1))];
};
////////////////////////////////////////////////////////////////////////////////
//name: [prn] in file: stdlib.ky near line: 74
//Print the input data as string
const prn = function(obj) {
  let pa = function(arr, s, e) {
    return [s, arr.map(prn).join(" "), e].join("");
  };
  return (function() {
    let S____1;
    switch (typeid(obj)) {
      case "lambda-arg":
        S____1 = ["%",(parseInt(obj.value) + 1)].join("");
        break;
      case "atom":
        S____1 = ["(atom ", prn(obj.value), ")"].join("");
        break;
      case "keyword":
        S____1 = [":", obj.value].join("");
        break;
      case "symbol":
        S____1 = obj.value;
        break;
      case "object":
        S____1 = stringify(obj);
        break;
      case "vector":
        S____1 = pa(obj, "[", "]");
        break;
      case "map":
        S____1 = pa(obj, "{", "}");
        break;
      case "array":
      case "list":
        S____1 = pa(obj, "(", ")");
        break;
      case "string":
        S____1 = obj;
        break;
      case "null":
      case "nil":
        S____1 = "null";
        break;
      default:
        S____1 = obj.toString();
        break;
    }
    return S____1;
  }).call(this);
};
//Defining a lambda positional argument
class LambdaArg {
  ////////////////////////////////////////////////////////////////////////////////
  //name: [constructor] in file: stdlib.ky near line: 94
  constructor(arg) {
    this["value"] = "";
    let name = ((arg === "%") ?
      "1" :
      arg.slice(1));
    let v = parseInt(name);
    if ( (!(v > 0)) ) {
      throw new Error(["invalid lambda-arg ", arg].join(""));
    }
    --v;
    this.value = [v].join("");
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [toString] in file: stdlib.ky near line: 103
  toString() {
    return this.value;
  }
}
//Defining a primitive data type
class Primitive {
  ////////////////////////////////////////////////////////////////////////////////
  //name: [constructor] in file: stdlib.ky near line: 108
  constructor(v) {
    this["value"] = null;
    this.value = v;
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [toString] in file: stdlib.ky near line: 110
  toString() {
    return this.value;
  }
}
//Defining a keyword
class Keyword {
  ////////////////////////////////////////////////////////////////////////////////
  //name: [constructor] in file: stdlib.ky near line: 115
  constructor(name) {
    this["value"] = "";
    this.value = name.slice(1);
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [toString] in file: stdlib.ky near line: 117
  toString() {
    return this.value;
  }
}
//Defining a symbol
class Symbol {
  ////////////////////////////////////////////////////////////////////////////////
  //name: [constructor] in file: stdlib.ky near line: 122
  constructor(name) {
    this["value"] = "";
    this.value = name;
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [toString] in file: stdlib.ky near line: 124
  toString() {
    return this.value;
  }
}
////////////////////////////////////////////////////////////////////////////////
//name: [primitive?] in file: stdlib.ky near line: 127
//Returns true if primitive
const primitive_QUERY = function(obj) {
  return (obj instanceof Primitive);
};
////////////////////////////////////////////////////////////////////////////////
//name: [primitive] in file: stdlib.ky near line: 131
//Create a Primitive
const primitive = function(v) {
  return new Primitive(v);
};
////////////////////////////////////////////////////////////////////////////////
//name: [symbol?] in file: stdlib.ky near line: 135
//Returns true if a symbol
const symbol_QUERY = function(obj) {
  return (obj instanceof Symbol);
};
////////////////////////////////////////////////////////////////////////////////
//name: [symbol] in file: stdlib.ky near line: 139
//Create a new Symbol
const symbol = function(name) {
  return new Symbol(name);
};
////////////////////////////////////////////////////////////////////////////////
//name: [keyword?] in file: stdlib.ky near line: 143
//Returns true if a keyword
const keyword_QUERY = function(obj) {
  return (obj instanceof Keyword);
};
////////////////////////////////////////////////////////////////////////////////
//name: [keyword] in file: stdlib.ky near line: 147
//Create a new Keyword
const keyword = function(name) {
  return new Keyword(name);
};
////////////////////////////////////////////////////////////////////////////////
//name: [lambda-arg?] in file: stdlib.ky near line: 151
//Returns true if a Lambda Arg
const lambda_DASH_arg_QUERY = function(obj) {
  return (obj instanceof LambdaArg);
};
////////////////////////////////////////////////////////////////////////////////
//name: [lambda-arg] in file: stdlib.ky near line: 155
//Create a new Lambda Arg
const lambda_DASH_arg = function(name) {
  return new LambdaArg(name);
};
//Defining a clojure-like Atom
class Atom {
  ////////////////////////////////////////////////////////////////////////////////
  //name: [constructor] in file: stdlib.ky near line: 161
  constructor(val) {
    this["value"] = null;
    this.value = val;
    return this;
  }
}
////////////////////////////////////////////////////////////////////////////////
//name: [atom?] in file: stdlib.ky near line: 164
//Returns true if an Atom
const atom_QUERY = function(atm) {
  return (atm instanceof Atom);
};
////////////////////////////////////////////////////////////////////////////////
//name: [atom] in file: stdlib.ky near line: 168
//Create a new Atom
const atom = function(val) {
  return new Atom(val);
};
////////////////////////////////////////////////////////////////////////////////
//name: [reset!] in file: stdlib.ky near line: 172
//Set a new value to the Atom
const reset_BANG = function(a, v) {
  return a.value = v;
};
////////////////////////////////////////////////////////////////////////////////
//name: [deref] in file: stdlib.ky near line: 176
//Get value inside the Atom
const deref = function(a) {
  return a.value;
};
////////////////////////////////////////////////////////////////////////////////
//name: [swap!] in file: stdlib.ky near line: 180
//Change value inside the Atom,
//returning the new value
const swap_BANG = function(a, f) {
  let xs = Array.prototype.slice.call(arguments, 2);
  a.value = f.apply(this, [a.value].concat(xs));
  return a["value"];
};
////////////////////////////////////////////////////////////////////////////////
//name: [typeid] in file: stdlib.ky near line: 188
//Returns the type-id
//of this object
const typeid = function(obj) {
  return (lambda_DASH_arg_QUERY(obj) ?
    "lambda-arg" :
    (keyword_QUERY(obj) ?
      "keyword" :
      (symbol_QUERY(obj) ?
        "symbol" :
        (vector_QUERY(obj) ?
          "vector" :
          (atom_QUERY(obj) ?
            "atom" :
            (list_QUERY(obj) ?
              "list" :
              (map_QUERY(obj) ?
                "map" :
                ((obj === null) ?
                  "null" :
                  ((true === obj) ?
                    "true" :
                    ((false === obj) ?
                      "false" :
                      ((typeof (obj) === "function") ?
                        "function" :
                        ((typeof (obj) === "string") ?
                          "string" :
                          ((typeof (obj) === "number") ?
                            "number" :
                            (Array.isArray(obj) ?
                              "array" :
                              (object_QUERY(obj) ?
                                "object" :
                                (true ?
                                  (function() {
                                    throw new Error(["Unknown type [", typeof (obj), "]"].join("")) ;
                                  }).call(this) :
                                  null))))))))))))))));
};
////////////////////////////////////////////////////////////////////////////////
//name: [value?] in file: stdlib.ky near line: 211
//Returns true
//if a simple value
const value_QUERY = function(obj) {
  return ((obj === null) || vector_QUERY(obj) || list_QUERY(obj) || map_QUERY(obj) || (false === obj) || (true === obj) || (typeof (obj) === "string") || (typeof (obj) === "number"));
};
////////////////////////////////////////////////////////////////////////////////
//name: [sequential?] in file: stdlib.ky near line: 224
//Returns true if coll
//implements Sequential
const sequential_QUERY = function(arr) {
  return (Array.isArray(arr) && (!map_QUERY(arr)));
};
////////////////////////////////////////////////////////////////////////////////
//name: [eq?] in file: stdlib.ky near line: 230
//Tests if two things are equal
const eq_QUERY = function(a, b) {
  let ta = typeid(a);
  let ok_QUERY = true;
  let tb = typeid(b);
  return ((!((ta === tb) || (sequential_QUERY(a) && sequential_QUERY(b)))) ?
    false :
    (function() {
      let S____2;
      switch (ta) {
        case "map":
        case "list":
        case "vector":
          S____2 = (function() {
            if ( (a.length !== b.length) ) {
              ok_QUERY = false;
            } else {
              for (let i = 0, sz = a.length, ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
                if ( (!eq_QUERY(a[i], b[i])) ) {
                  ok_QUERY = false;
                  ____break = true;
                }
              }
            }
            return ok_QUERY;
          }).call(this);
          break;
        case "object":
          S____2 = (function() {
            if ( (!(count(a) === count(b))) ) {
              ok_QUERY = false;
            } else {
              for (let i = 0, k = null, ks = Object.keys(a), ____break = false; ((!____break) && (i < ks.length)); i = (i + 1)) {
                k = ks[i];
                if ( (!eq_QUERY(a[k], b[k])) ) {
                  ok_QUERY = false;
                  ____break = true;
                }
              }
            }
            return ok_QUERY;
          }).call(this);
          break;
        case "symbol":
        case "keyword":
          S____2 = (a.value === b.value);
          break;
        default:
          S____2 = (a === b);
          break;
      }
      return S____2;
    }).call(this));
};
////////////////////////////////////////////////////////////////////////////////
//name: [object?] in file: stdlib.ky near line: 267
//Returns true
//if a js object
const object_QUERY = function(obj) {
  return ((!((obj === null) || Array.isArray(obj))) ?
    (typeof (obj) === "object") :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//name: [last] in file: stdlib.ky near line: 274
//Returns the last element
const last = function(coll) {
  return ((Array.isArray(coll) && (coll.length > 0)) ?
    coll[(coll.length - 1)] :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//name: [into!] in file: stdlib.ky near line: 280
//Assign a type to this collection
const into_BANG = function(type, coll) {
  {
    let S____3;
    switch (type) {
      case "vector":
        S____3 = coll["____vec"] = true;
        break;
      case "list":
        S____3 = coll["____list"] = true;
        break;
      case "map":
        S____3 = coll["____map"] = true;
        break;
    }
  }
  return coll;
};
////////////////////////////////////////////////////////////////////////////////
//name: [into] in file: stdlib.ky near line: 291
//Like into! but
//returning a new collection
const into = function(type, coll) {
  return into_BANG(type, coll.slice(0));
};
////////////////////////////////////////////////////////////////////////////////
//name: [pairs?] in file: stdlib.ky near line: 297
//Returns true if
//a LISP list, not data
const pairs_QUERY = function(obj) {
  return (Array.isArray(obj) && (!vector_QUERY(obj)) && (!map_QUERY(obj)) && (!list_QUERY(obj)));
};
////////////////////////////////////////////////////////////////////////////////
//name: [list?] in file: stdlib.ky near line: 306
//Returns true if a List
const list_QUERY = function(obj) {
  return (Array.isArray(obj) && obj.____list);
};
////////////////////////////////////////////////////////////////////////////////
//name: [list] in file: stdlib.ky near line: 310
//Create a List
const list = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  xs["____list"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//name: [vector?] in file: stdlib.ky near line: 314
//Returns true if a Vector
const vector_QUERY = function(obj) {
  return (Array.isArray(obj) && obj.____vec);
};
////////////////////////////////////////////////////////////////////////////////
//name: [vector] in file: stdlib.ky near line: 318
//Create a Vector
const vector = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  xs["____vec"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//name: [map?] in file: stdlib.ky near line: 322
//Returns true if a Hashmap
const map_QUERY = function(obj) {
  return (Array.isArray(obj) && obj.____map);
};
////////////////////////////////////////////////////////////////////////////////
//name: [hashmap] in file: stdlib.ky near line: 326
//Create a new Hashmap
const hashmap = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  if ( (!(0 === modulo(xs.length, 2))) ) {
    throw new Error("Invalid arity for hashmap");
  }
  xs["____map"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//name: [seq] in file: stdlib.ky near line: 332
//Returns a sequence
const seq = function(obj) {
  return ((typeof (obj) === "string") ?
    obj.split("") :
    (Array.isArray(obj) ?
      obj.slice(0) :
      (object_QUERY(obj) ?
        Object.entries(obj) :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//name: [contains?] in file: stdlib.ky near line: 340
//Returns true
//if item is inside
const contains_QUERY = function(coll, x) {
  return ((Array.isArray(coll) || (typeof (coll) === "string")) ?
    coll.includes(x) :
    (object_QUERY(coll) ?
      coll.hasOwnProperty(x) :
      (true ?
        false :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//name: [nichts?] in file: stdlib.ky near line: 350
//Returns true if object is
//either null of undefined
const nichts_QUERY = function(obj) {
  return ((typeof (obj) === "undefined") || (obj === null));
};
////////////////////////////////////////////////////////////////////////////////
//name: [some?] in file: stdlib.ky near line: 355
//Returns true if object is
//defined and not null
const some_QUERY = function(obj) {
  return (!nichts_QUERY(obj));
};
////////////////////////////////////////////////////////////////////////////////
//name: [count] in file: stdlib.ky near line: 360
//Count the number of elements inside
const count = function(coll) {
  return (coll ?
    (((typeof (coll) === "string") || Array.isArray(coll)) ?
      coll :
      Object.keys(coll)).length :
    0);
};
////////////////////////////////////////////////////////////////////////////////
//name: [concat*] in file: stdlib.ky near line: 367
//Add many to this collection
const concat_STAR = function(coll) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return (coll ?
    coll.concat.apply(coll, xs) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//name: [every] in file: stdlib.ky near line: 372
const every = function(coll, start, step) {
  let ret = [];
  for (let i = start, sz = coll.length, ____break = false; ((!____break) && (i < sz)); i = (i + step)) {
    conj_BANG(ret, coll[i]);
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [evens] in file: stdlib.ky near line: 380
//Collect every
//2nd item starting at 0
const evens = function(coll) {
  return every(coll, 0, 2);
};
////////////////////////////////////////////////////////////////////////////////
//name: [odds] in file: stdlib.ky near line: 385
//Collect every
//2nd item starting at 1
const odds = function(coll) {
  return every(coll, 1, 2);
};
////////////////////////////////////////////////////////////////////////////////
//name: [modulo] in file: stdlib.ky near line: 390
//Modulo
const modulo = function(x, N) {
  return ((x < 0) ?
    (x - (-1 * (N + (Math.floor(((-x) / N)) * N)))) :
    (x % N));
};
////////////////////////////////////////////////////////////////////////////////
//name: [interleave] in file: stdlib.ky near line: 398
//Returns a seq of the first item
//in each coll, then the second, etc
const interleave = function(c1, c2) {
  let cz = ((c2.length < c1.length) ?
    c2.length :
    c1.length);
  let ret = [];
  for (let i = 0, ____break = false; ((!____break) && (i < cz)); i = (i + 1)) {
    conj_BANG(ret, c1[i], c2[i]);
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [zipmap] in file: stdlib.ky near line: 411
//Returns a map with the
//keys mapped to the corresponding vals
const zipmap = function(keys, vals) {
  let cz = ((keys.length < vals.length) ?
    keys.length :
    vals.length);
  let ret = {};
  for (let i = 0, ____break = false; ((!____break) && (i < cz)); i = (i + 1)) {
    ret[[keys[i]].join("")] = vals[i];
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [extendAttr] in file: stdlib.ky near line: 425
const extendAttr = function(obj, attr) {
  let G____4 = Array.prototype.slice.call(arguments, 2);
  let flags = G____4[0];
  flags = opt_QUERY__QUERY(flags, {
    "enumerable": false,
    "writable": true
  });
  Object.defineProperty(obj, attr, flags);
  return obj;
};
const gensym_DASH_counter = atom(0);
////////////////////////////////////////////////////////////////////////////////
//name: [gensym] in file: stdlib.ky near line: 434
//Generates next random symbol
const gensym = function() {
  let G____5 = Array.prototype.slice.call(arguments, 0);
  let pfx = G____5[0];
  return symbol([opt_QUERY__QUERY(pfx, "GS__"), swap_BANG(gensym_DASH_counter, function(x) {
    return (x + 1);
  })].join(""));
};
////////////////////////////////////////////////////////////////////////////////
//name: [slice] in file: stdlib.ky near line: 441
const slice = function(coll) {
  let G____6 = Array.prototype.slice.call(arguments, 1);
  let start = G____6[0];
  let end = G____6[1];
  return ((typeof (end) !== "undefined") ?
    Array.prototype.slice.call(coll, start, end) :
    ((typeof (start) !== "undefined") ?
      Array.prototype.slice.call(coll, start) :
      Array.prototype.slice.call(coll)));
};
var m_DASH_identity = {
  "bind": function(mv, mf) {
    return mf(mv);
  },
  "result": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ____args[0];
  }
};
var m_DASH_maybe = {
  "bind": function(mv, mf) {
    return ((mv === null) ?
      null :
      mf(mv));
  },
  "result": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ____args[0];
  },
  "zero": null
};
var m_DASH_array = {
  "bind": function(mv, mf) {
    return mv.map(mf).reduce(function(acc, v) {
      return acc.concat(v);
    }, []);
  },
  "result": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return [].concat(____args[0]);
  },
  "zero": [],
  "plus": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ____args.reduce(function(acc, v) {
      return acc.concat(v);
    }, []);
  }
};
var m_DASH_state = {
  "bind": function(mv, mf) {
    return function(s) {
      let x = mv(s);
      return mf(x[0])(x[1]);
    };
  },
  "result": function(v) {
    return function(s) {
      return [].concat([v, s]);
    };
  }
};
var m_DASH_continuation = {
  "bind": function(mv, mf) {
    return function(c) {
      return mv(function(v) {
        return mf(v)(c);
      });
    };
  },
  "result": function(v) {
    return function(c) {
      return c(v);
    };
  }
};
module.exports = {
  not_DASH_empty: not_DASH_empty,
  stringify: stringify,
  opt_QUERY__QUERY: opt_QUERY__QUERY,
  conj_BANG: conj_BANG,
  conj: conj,
  pop_BANG: pop_BANG,
  pop: pop,
  prn: prn,
  LambdaArg: LambdaArg,
  Primitive: Primitive,
  Keyword: Keyword,
  Symbol: Symbol,
  primitive_QUERY: primitive_QUERY,
  primitive: primitive,
  symbol_QUERY: symbol_QUERY,
  symbol: symbol,
  keyword_QUERY: keyword_QUERY,
  keyword: keyword,
  lambda_DASH_arg_QUERY: lambda_DASH_arg_QUERY,
  lambda_DASH_arg: lambda_DASH_arg,
  Atom: Atom,
  atom_QUERY: atom_QUERY,
  atom: atom,
  reset_BANG: reset_BANG,
  deref: deref,
  swap_BANG: swap_BANG,
  typeid: typeid,
  value_QUERY: value_QUERY,
  sequential_QUERY: sequential_QUERY,
  eq_QUERY: eq_QUERY,
  object_QUERY: object_QUERY,
  last: last,
  into_BANG: into_BANG,
  into: into,
  pairs_QUERY: pairs_QUERY,
  list_QUERY: list_QUERY,
  list: list,
  vector_QUERY: vector_QUERY,
  vector: vector,
  map_QUERY: map_QUERY,
  hashmap: hashmap,
  seq: seq,
  contains_QUERY: contains_QUERY,
  nichts_QUERY: nichts_QUERY,
  some_QUERY: some_QUERY,
  count: count,
  concat_STAR: concat_STAR,
  evens: evens,
  odds: odds,
  modulo: modulo,
  interleave: interleave,
  zipmap: zipmap,
  extendAttr: extendAttr,
  gensym: gensym,
  slice: slice,
  m_DASH_identity: m_DASH_identity,
  m_DASH_maybe: m_DASH_maybe,
  m_DASH_array: m_DASH_array,
  m_DASH_state: m_DASH_state,
  m_DASH_continuation: m_DASH_continuation
};