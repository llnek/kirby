/*Auto generated by Kirby - v1.0.0 czlab.kirby.stdlib - Sun Dec 03 2017 00:53:21 GMT-0800 (PST)*/

////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 13
//If coll is empty,
//returns nil, else coll
const not_DASH_empty = function(coll) {
  return ((0 === count(coll)) ?
    null :
    coll);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 19
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
//fn: [defn] in file: stdlib.ky,line: 32
//If cur is not defined,
//returns other else returns cur
const opt_QUERY__QUERY = function(cur, other) {
  return ((typeof (cur) !== "undefined") ?
    cur :
    other);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 38
//If coll is a list,
//prepends to head of coll else appends all to end
const conj_BANG = function(coll) {
  let xs = slice(arguments, 1);
  if (list_QUERY(coll)) {
    coll.unshift.apply(coll, xs.reverse());
  } else {
    coll.push.apply(coll, xs);
  }
  return coll;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 46
//Like conj! but
//returns a new collection
const conj = function(coll) {
  let xs = slice(arguments, 1);
  let c = (vector_QUERY(coll) ?
    into("vector", coll) :
    (list_QUERY(coll) ?
      into("list", coll) :
      (map_QUERY(coll) ?
        into("map", coll) :
        (true ?
          Array.prototype.slice.call(coll) :
          null))));
  return conj_BANG.apply(this, [
    c
  ].concat(xs));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 60
//Removes the first element if list,
//else removes the last element,
//returning the element
//and the altered collection
const pop_BANG = function(coll) {
  let r = (list_QUERY(coll) ?
    coll.shift() :
    coll.pop());
  return [
    r,
    coll
  ];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 68
//Like pop! but returns a new collection
const pop = function(coll) {
  let r = (list_QUERY(coll) ?
    coll[0] :
    last(coll));
  return [
    r,
    (list_QUERY(coll) ?
      coll.slice(1) :
      coll.slice(0, -1))
  ];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 74
//Print the input data as string
const prn = function(obj) {
  let pa = function(arr, s, e) {
    return [
      s,
      arr.map(prn).join(" "),
      e
    ].join("");
  };
  return (function() {
    let C__1;
    switch (typeid(obj)) {
      case "lambda-arg":
        C__1 = [
          "%",
          (parseInt(obj.value) + 1)
        ].join("");
        break;
      case "atom":
        C__1 = [
          "(atom ",
          prn(obj.value),
          ")"
        ].join("");
        break;
      case "keyword":
        C__1 = [
          ":",
          obj.value
        ].join("");
        break;
      case "symbol":
        C__1 = obj.value;
        break;
      case "object":
        C__1 = stringify(obj);
        break;
      case "vector":
        C__1 = pa(obj, "[", "]");
        break;
      case "map":
        C__1 = pa(obj, "{", "}");
        break;
      case "array":
      case "list":
        C__1 = pa(obj, "(", ")");
        break;
      case "string":
        C__1 = obj;
        break;
      case "null":
      case "nil":
        C__1 = "null";
        break;
      default:
        C__1 = obj.toString();
        break;
    }
    return C__1;
  }).call(this);
};
//Defining a lambda positional argument
class LambdaArg {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 94
  constructor(arg) {
    this["value"] = "";
    let name = ((arg === "%") ?
      "1" :
      arg.slice(1));
    let v = parseInt(name);
    if ( (!(v > 0)) ) {
      throw new Error([
        "invalid lambda-arg ",
        arg
      ].join(""));
    } else {
      null;
    }
    --v;
    this.value = [
      v
    ].join("");
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 103
  toString() {
    return this.value;
  }
}
//Defining a primitive data type
class Primitive {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 108
  constructor(v) {
    this["value"] = null;
    this.value = v;
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 110
  toString() {
    return this.value;
  }
}
//Defining a keyword
class Keyword {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 115
  constructor(name) {
    this["value"] = "";
    this.value = name.slice(1);
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 117
  toString() {
    return this.value;
  }
}
//Defining a symbol
class Symbol {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 122
  constructor(name) {
    this["value"] = "";
    this.value = name;
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 124
  toString() {
    return this.value;
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 127
//Returns true if primitive
const primitive_QUERY = function(obj) {
  return (obj instanceof Primitive);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 131
//Create a Primitive
const primitive = function(v) {
  return new Primitive(v);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 135
//Returns true if a symbol
const symbol_QUERY = function(obj) {
  return (obj instanceof Symbol);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 139
//Create a new Symbol
const symbol = function(name) {
  return new Symbol(name);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 143
//Returns true if a keyword
const keyword_QUERY = function(obj) {
  return (obj instanceof Keyword);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 147
//Create a new Keyword
const keyword = function(name) {
  return new Keyword(name);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 151
//Returns true if a Lambda Arg
const lambda_DASH_arg_QUERY = function(obj) {
  return (obj instanceof LambdaArg);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 155
//Create a new Lambda Arg
const lambda_DASH_arg = function(name) {
  return new LambdaArg(name);
};
//Defining a clojure-like Atom
class Atom {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [method] in file: stdlib.ky,line: 161
  constructor(val) {
    this["value"] = null;
    this.value = val;
    return this;
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 164
//Returns true if an Atom
const atom_QUERY = function(atm) {
  return (atm instanceof Atom);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 168
//Create a new Atom
const atom = function(val) {
  return new Atom(val);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 172
//Set a new value to the Atom
const reset_BANG = function(a, v) {
  return a.value = v;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 176
//Get value inside the Atom
const deref = function(a) {
  return a.value;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 180
//Change value inside the Atom,
//returning the new value
const swap_BANG = function(a, f) {
  let xs = slice(arguments, 2);
  a.value = f.apply(this, [
    a.value
  ].concat(xs));
  return a["value"];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 188
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
                                    throw new Error([
                                      "Unknown type [",
                                      typeof (obj),
                                      "]"
                                    ].join(""));
                                  }).call(this) :
                                  null))))))))))))))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 211
//Returns true
//if a simple value
const value_QUERY = function(obj) {
  return ((obj === null) || vector_QUERY(obj) || list_QUERY(obj) || map_QUERY(obj) || (false === obj) || (true === obj) || (typeof (obj) === "string") || (typeof (obj) === "number"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 224
//Returns true if coll
//implements Sequential
const sequential_QUERY = function(arr) {
  return (Array.isArray(arr) && (!map_QUERY(arr)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 230
//Tests if two things are equal
const eq_QUERY = function(a, b) {
  let ta = typeid(a);
  let ok_QUERY = true;
  let tb = typeid(b);
  return ((!((ta === tb) || (sequential_QUERY(a) && sequential_QUERY(b)))) ?
    false :
    (function() {
      let C__2;
      switch (ta) {
        case "map":
        case "list":
        case "vector":
          C__2 = (function() {
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
          C__2 = (function() {
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
          C__2 = (a.value === b.value);
          break;
        default:
          C__2 = (a === b);
          break;
      }
      return C__2;
    }).call(this));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 267
//Returns true
//if a js object
const object_QUERY = function(obj) {
  return ((!((obj === null) || Array.isArray(obj))) ?
    (typeof (obj) === "object") :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 274
//Returns the last element
const last = function(coll) {
  return ((Array.isArray(coll) && (coll.length > 0)) ?
    coll[(coll.length - 1)] :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 280
//Assign a type to this collection
const into_BANG = function(type, coll) {
  let C__3;
  switch (type) {
    case "vector":
      C__3 = coll["____vec"] = true;
      break;
    case "list":
      C__3 = coll["____list"] = true;
      break;
    case "map":
      C__3 = coll["____map"] = true;
      break;
  }
  return coll;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 291
//Like into! but
//returning a new collection
const into = function(type, coll) {
  return into_BANG(type, coll.slice(0));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 297
//Returns true if
//a LISP list, not data
const pairs_QUERY = function(obj) {
  return (Array.isArray(obj) && (!vector_QUERY(obj)) && (!map_QUERY(obj)) && (!list_QUERY(obj)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 306
//Returns true if a List
const list_QUERY = function(obj) {
  return (Array.isArray(obj) && obj.____list);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 310
//Create a List
const list = function() {
  let xs = slice(arguments, 0);
  xs["____list"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 314
//Returns true if a Vector
const vector_QUERY = function(obj) {
  return (Array.isArray(obj) && obj.____vec);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 318
//Create a Vector
const vector = function() {
  let xs = slice(arguments, 0);
  xs["____vec"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 322
//Returns true if a Hashmap
const map_QUERY = function(obj) {
  return (Array.isArray(obj) && obj.____map);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 326
//Create a new Hashmap
const hashmap = function() {
  let xs = slice(arguments, 0);
  if ( (!(0 === modulo(xs.length, 2))) ) {
    throw new Error("Invalid arity for hashmap");
  }
  xs["____map"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 332
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
//fn: [defn] in file: stdlib.ky,line: 340
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
//fn: [defn] in file: stdlib.ky,line: 350
//Returns true if object is
//either null of undefined
const nichts_QUERY = function(obj) {
  return ((typeof (obj) === "undefined") || (obj === null));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 355
//Returns true if object is
//defined and not null
const some_QUERY = function(obj) {
  return (!nichts_QUERY(obj));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 360
//Count the number of elements inside
const count = function(coll) {
  return (coll ?
    (((typeof (coll) === "string") || Array.isArray(coll)) ?
      coll :
      Object.keys(coll)).length :
    0);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 367
//Add many to this collection
const concat_STAR = function(coll) {
  let xs = slice(arguments, 1);
  return (coll ?
    coll.concat.apply(coll, xs) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn-] in file: stdlib.ky,line: 372
const every = function(coll, start, step) {
  let ret = [];
  for (let i = start, sz = coll.length, ____break = false; ((!____break) && (i < sz)); i = (i + step)) {
    conj_BANG(ret, coll[i]);
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 380
//Collect every
//2nd item starting at 0
const evens = function(coll) {
  return every(coll, 0, 2);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 385
//Collect every
//2nd item starting at 1
const odds = function(coll) {
  return every(coll, 1, 2);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 390
//Modulo
const modulo = function(x, N) {
  return ((x < 0) ?
    (x - (-1 * (N + (Math.floor(((-x) / N)) * N)))) :
    (x % N));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 398
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
//fn: [defn] in file: stdlib.ky,line: 411
//Returns a map with the
//keys mapped to the corresponding vals
const zipmap = function(keys, vals) {
  let cz = ((keys.length < vals.length) ?
    keys.length :
    vals.length);
  let ret = {};
  for (let i = 0, ____break = false; ((!____break) && (i < cz)); i = (i + 1)) {
    ret[[
      keys[i]
    ].join("")] = vals[i];
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 425
const extendAttr = function(obj, attr) {
  let GS__4 = slice(arguments, 2);
  let flags = GS__4[0];
  flags = opt_QUERY__QUERY(flags, {
    "enumerable": false,
    "writable": true
  });
  Object.defineProperty(obj, attr, flags);
  return obj;
};
const gensym_DASH_counter = atom(0);
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 434
//Generates next random symbol
const gensym = function() {
  let GS__5 = slice(arguments, 0);
  let pfx = GS__5[0];
  return symbol([
    opt_QUERY__QUERY(pfx, "GS__"),
    swap_BANG(gensym_DASH_counter, function(x) {
      return (x + 1);
    })
  ].join(""));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [defn] in file: stdlib.ky,line: 441
const slice = function(coll) {
  let GS__6 = slice(arguments, 1);
  let start = GS__6[0];
  let end = GS__6[1];
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
      return [].concat([
        v,
        s
      ]);
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