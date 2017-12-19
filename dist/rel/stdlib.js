/*Auto generated by Kirby - v1.0.0 czlab.kirby.stdlib - Mon Dec 18 2017 23:59:42 GMT-0800 (PST)*/

////////////////////////////////////////////////////////////////////////////////
//fn: [not-empty] in file: stdlib.ky,line: 13
//If coll is empty,
//returns nil, else coll
const not_DASH_empty = function(coll) {
  return ((0 === count(coll)) ?
    null :
    coll);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [stringify] in file: stdlib.ky,line: 19
//JSON stringify without
//circular object reference
const stringify = function(obj) {
  let cache = [];
  return (obj ?
    JSON.stringify(obj, function(k, v) {
      if (( (typeof (v) === "function") )) {
        v = "native-function";
      } else {
        if (object_QUERY(v)) {
          if (contains_QUERY(cache, v)) {
            v = undefined;
          } else {
            conj_BANG(cache, v);
          }
        } else {
          null;
        }
      }
      return v;
    }) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [opt??] in file: stdlib.ky,line: 36
//If cur is not defined,
//returns other else returns cur
const opt_QUERY__QUERY = function(cur, other) {
  return (((typeof (cur) !== "undefined")) ?
    cur :
    other);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [conj!] in file: stdlib.ky,line: 42
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
//fn: [conj] in file: stdlib.ky,line: 50
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
  return conj_BANG.apply(this, [
    c
  ].concat(xs));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [pop!] in file: stdlib.ky,line: 64
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
//fn: [pop] in file: stdlib.ky,line: 72
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
//fn: [dumpObj] in file: stdlib.ky,line: 78
const dumpObj = function(obj) {
  return seq(obj).reduce(function(acc, GS__1) {
    let k = GS__1[0];
    let v = GS__1[1];
    return acc += [
      prn(k),
      " : ",
      prn(v),
      "\n"
    ].join("");
  }, "");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [prn] in file: stdlib.ky,line: 88
//Print the input data as string
const prn = function(obj) {
  let GS__2 = Array.prototype.slice.call(arguments, 1);
  let r_QUERY = GS__2[0];
  let pa = function(arr, s, e) {
    return [
      s,
      arr.map(prn).join(" "),
      e
    ].join("");
  };
  return (function() {
    let C__3;
    switch (typeid(obj)) {
      case "lambda_DASH_arg":
        C__3 = [
          "%",
          (parseInt(obj.value) + 1)
        ].join("");
        break;
      case "atom":
        C__3 = [
          "(atom ",
          prn(obj.value),
          ")"
        ].join("");
        break;
      case "keyword":
        C__3 = [
          ":",
          obj.value
        ].join("");
        break;
      case "symbol":
        C__3 = obj.value;
        break;
      case "object":
        C__3 = dumpObj(obj);
        break;
      case "vector":
        C__3 = pa(obj, "[", "]");
        break;
      case "map":
        C__3 = pa(obj, "{", "}");
        break;
      case "array":
      case "list":
        C__3 = pa(obj, "(", ")");
        break;
      case "string":
        C__3 = (r_QUERY ?
          wrap_DASH_str(obj) :
          obj);
        break;
      case "null":
      case "nil":
        C__3 = "null";
        break;
      default:
        C__3 = obj.toString();
        break;
    }
    return C__3;
  }).call(this);
};
//Defining a lambda positional argument
class LambdaArg {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: stdlib.ky,line: 109
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
  //fn: [toString] in file: stdlib.ky,line: 118
  toString() {
    return this.value;
  }
}
//Defining a primitive data type
class Primitive {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: stdlib.ky,line: 123
  constructor(v) {
    this["value"] = null;
    this.value = v;
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [toString] in file: stdlib.ky,line: 125
  toString() {
    return this.value;
  }
}
//Defining a keyword
class Keyword {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: stdlib.ky,line: 130
  constructor(name) {
    this["value"] = "";
    this.value = name.slice(1);
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [toString] in file: stdlib.ky,line: 132
  toString() {
    return this.value;
  }
}
//Defining a symbol
class Symbol {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: stdlib.ky,line: 137
  constructor(name) {
    this["value"] = "";
    this.value = name;
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [toString] in file: stdlib.ky,line: 139
  toString() {
    return this.value;
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [primitive?] in file: stdlib.ky,line: 142
//Returns true if primitive
const primitive_QUERY = function(obj) {
  return (obj instanceof Primitive);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [primitive] in file: stdlib.ky,line: 146
//Create a Primitive
const primitive = function(v) {
  return new Primitive(v);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [symbol?] in file: stdlib.ky,line: 150
//Returns true if a symbol
const symbol_QUERY = function(obj) {
  return (obj instanceof Symbol);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [symbol] in file: stdlib.ky,line: 154
//Create a new Symbol
const symbol = function(name) {
  return new Symbol(name);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [keyword?] in file: stdlib.ky,line: 158
//Returns true if a keyword
const keyword_QUERY = function(obj) {
  return (obj instanceof Keyword);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [keyword] in file: stdlib.ky,line: 162
//Create a new Keyword
const keyword = function(name) {
  return new Keyword(name);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [keyword->symbol] in file: stdlib.ky,line: 166
//Convert a Keyword to Symbol
const keyword_DASH__GT_symbol = function(k) {
  let s = new Symbol(k.value);
  (s["source"] = k.source, s["line"] = k.line, s["column"] = k.column);
  return s;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [lambda-arg?] in file: stdlib.ky,line: 174
//Returns true if a Lambda Arg
const lambda_DASH_arg_QUERY = function(obj) {
  return (obj instanceof LambdaArg);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [lambda-arg] in file: stdlib.ky,line: 178
//Create a new Lambda Arg
const lambda_DASH_arg = function(name) {
  return new LambdaArg(name);
};
//Defining a clojure-like Atom
class Atom {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: stdlib.ky,line: 184
  constructor(val) {
    this["value"] = null;
    this.value = val;
    return this;
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [atom?] in file: stdlib.ky,line: 187
//Returns true if an Atom
const atom_QUERY = function(atm) {
  return (atm instanceof Atom);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [atom] in file: stdlib.ky,line: 191
//Create a new Atom
const atom = function(val) {
  return new Atom(val);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [reset!] in file: stdlib.ky,line: 195
//Set a new value to the Atom
const reset_BANG = function(a, v) {
  a.value = v;
  return null;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [deref] in file: stdlib.ky,line: 199
//Get value inside the Atom
const deref = function(a) {
  return a.value;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [swap!] in file: stdlib.ky,line: 203
//Change value inside the Atom,
//returning the new value
const swap_BANG = function(a, f) {
  let xs = Array.prototype.slice.call(arguments, 2);
  a.value = f.apply(this, [
    a.value
  ].concat(xs));
  return a["value"];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [typeid] in file: stdlib.ky,line: 211
//Returns the type-id
//of this object
const typeid = function(obj) {
  return (lambda_DASH_arg_QUERY(obj) ?
    "lambda_DASH_arg" :
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
                (((obj === null)) ?
                  "null" :
                  (((obj === true)) ?
                    "true" :
                    (((obj === false)) ?
                      "false" :
                      (((typeof (obj) === "function")) ?
                        "function" :
                        (((typeof (obj) === "string")) ?
                          "string" :
                          (((typeof (obj) === "number")) ?
                            "number" :
                            ((Array.isArray(obj)) ?
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
//fn: [value?] in file: stdlib.ky,line: 234
//Returns true
//if a simple value
const value_QUERY = function(obj) {
  return (((obj === null)) || vector_QUERY(obj) || list_QUERY(obj) || map_QUERY(obj) || ((obj === false)) || ((obj === true)) || ((typeof (obj) === "string")) || ((typeof (obj) === "number")));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [sequential?] in file: stdlib.ky,line: 247
//Returns true if coll
//implements Sequential
const sequential_QUERY = function(arr) {
  return ((Array.isArray(arr)) && (!map_QUERY(arr)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [eq?] in file: stdlib.ky,line: 253
//Tests if two things are equal
const eq_QUERY = function(a, b) {
  let ta = typeid(a);
  let ok_QUERY = true;
  let tb = typeid(b);
  return ((!((ta === tb) || (sequential_QUERY(a) && sequential_QUERY(b)))) ?
    false :
    (function() {
      let C__4;
      switch (ta) {
        case "map":
        case "list":
        case "vector":
          C__4 = (function() {
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
          C__4 = (function() {
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
          C__4 = (a.value === b.value);
          break;
        default:
          C__4 = (a === b);
          break;
      }
      return C__4;
    }).call(this));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [object?] in file: stdlib.ky,line: 290
//Returns true
//if a js object
const object_QUERY = function(obj) {
  return ((!(((obj === null)) || (Array.isArray(obj)))) ?
    (typeof (obj) === "object") :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [last] in file: stdlib.ky,line: 297
//Returns the last element
const last = function(coll) {
  return (((Array.isArray(coll)) && (coll.length > 0)) ?
    coll[(coll.length - 1)] :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [into!] in file: stdlib.ky,line: 303
//Assign a type to this collection
const into_BANG = function(type, coll) {
  let C__5;
  switch (type) {
    case "vector":
      C__5 = coll["____vec"] = true;
      break;
    case "list":
      C__5 = coll["____list"] = true;
      break;
    case "map":
      C__5 = coll["____map"] = true;
      break;
  }
  return coll;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [into] in file: stdlib.ky,line: 314
//Like into! but
//returning a new collection
const into = function(type, coll) {
  return into_BANG(type, coll.slice(0));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [pairs?] in file: stdlib.ky,line: 320
//Returns true if
//a LISP list, not data
const pairs_QUERY = function(obj) {
  return ((Array.isArray(obj)) && (!vector_QUERY(obj)) && (!map_QUERY(obj)) && (!list_QUERY(obj)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [list?] in file: stdlib.ky,line: 329
//Returns true if a List
const list_QUERY = function(obj) {
  return ((Array.isArray(obj)) && obj.____list);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [list] in file: stdlib.ky,line: 333
//Create a List
const list = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  xs["____list"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [vector?] in file: stdlib.ky,line: 337
//Returns true if a Vector
const vector_QUERY = function(obj) {
  return ((Array.isArray(obj)) && obj.____vec);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [vector] in file: stdlib.ky,line: 341
//Create a Vector
const vector = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  xs["____vec"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [map?] in file: stdlib.ky,line: 345
//Returns true if a Hashmap
const map_QUERY = function(obj) {
  return ((Array.isArray(obj)) && obj.____map);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [hashmap] in file: stdlib.ky,line: 349
//Create a new Hashmap
const hashmap = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  if (( (!((0 === modulo(xs.length, 2)))) )) {
    throw new Error("Invalid arity for hashmap");
  }
  xs["____map"] = true;
  return xs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [seq] in file: stdlib.ky,line: 355
//Returns a sequence
const seq = function(obj) {
  return (((typeof (obj) === "string")) ?
    obj.split("") :
    ((Array.isArray(obj)) ?
      obj.slice(0) :
      (object_QUERY(obj) ?
        Object.entries(obj) :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [contains?] in file: stdlib.ky,line: 363
//Returns true
//if item is inside
const contains_QUERY = function(coll, x) {
  return (((Array.isArray(coll)) || ((typeof (coll) === "string"))) ?
    coll.includes(x) :
    (object_QUERY(coll) ?
      coll.hasOwnProperty(x) :
      (true ?
        false :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [nichts?] in file: stdlib.ky,line: 373
//Returns true if object is
//either null of undefined
const nichts_QUERY = function(obj) {
  return (((typeof (obj) === "undefined")) || ((obj === null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [some?] in file: stdlib.ky,line: 378
//Returns true if object is
//defined and not null
const some_QUERY = function(obj) {
  return (!nichts_QUERY(obj));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [count] in file: stdlib.ky,line: 383
//Count the number of elements inside
const count = function(coll) {
  return (coll ?
    ((((typeof (coll) === "string")) || (Array.isArray(coll))) ?
      coll :
      Object.keys(coll)).length :
    0);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [concat*] in file: stdlib.ky,line: 390
//Add many to this collection
const concat_STAR = function(coll) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return (coll ?
    coll.concat.apply(coll, xs) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [every] in file: stdlib.ky,line: 395
const every = function(coll, start, step) {
  let ret = [];
  for (let i = start, sz = coll.length, ____break = false; ((!____break) && (i < sz)); i = (i + step)) {
    conj_BANG(ret, coll[i]);
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [evens] in file: stdlib.ky,line: 403
//Collect every
//2nd item starting at 0
const evens = function(coll) {
  return every(coll, 0, 2);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [odds] in file: stdlib.ky,line: 408
//Collect every
//2nd item starting at 1
const odds = function(coll) {
  return every(coll, 1, 2);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [modulo] in file: stdlib.ky,line: 413
//Modulo
const modulo = function(x, N) {
  return ((x < 0) ?
    (x - (-1 * (N + (Math.floor(((-1 * x) / N)) * N)))) :
    (x % N));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [interleave] in file: stdlib.ky,line: 421
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
//fn: [zipmap] in file: stdlib.ky,line: 434
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
//fn: [extendAttr] in file: stdlib.ky,line: 448
const extendAttr = function(obj, attr) {
  let GS__6 = Array.prototype.slice.call(arguments, 2);
  let flags = GS__6[0];
  flags = opt_QUERY__QUERY(flags, {
    "enumerable": false,
    "writable": true
  });
  Object.defineProperty(obj, attr, flags);
  return obj;
};
const gensym_DASH_counter = atom(0);
////////////////////////////////////////////////////////////////////////////////
//fn: [gensym] in file: stdlib.ky,line: 457
//Generates next random symbol
const gensym = function() {
  let GS__7 = Array.prototype.slice.call(arguments, 0);
  let pfx = GS__7[0];
  return symbol([
    opt_QUERY__QUERY(pfx, "GS__"),
    swap_BANG(gensym_DASH_counter, function(x) {
      return (x + 1);
    })
  ].join(""));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [slice] in file: stdlib.ky,line: 464
const slice = function(coll) {
  let GS__8 = Array.prototype.slice.call(arguments, 1);
  let start = GS__8[0];
  let end = GS__8[1];
  return (((typeof (end) !== "undefined")) ?
    Array.prototype.slice.call(coll, start, end) :
    (((typeof (start) !== "undefined")) ?
      Array.prototype.slice.call(coll, start) :
      Array.prototype.slice.call(coll)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [assoc!] in file: stdlib.ky,line: 472
const assoc_BANG = function(mmap) {
  let xs = Array.prototype.slice.call(arguments, 1);
  if (mmap) {
    for (let i = 0, sz = count(xs), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
      mmap[xs[i]] = xs[i + 1];
    }
  }
  return mmap;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dissoc!] in file: stdlib.ky,line: 481
const dissoc_BANG = function(mmap) {
  let xs = Array.prototype.slice.call(arguments, 1);
  if (mmap) {
    let GS__9 = xs;
    for (let GS__11 = 0, GS__10 = false, ____break = false; ((!____break) && ((!GS__10) && (GS__11 < GS__9.length))); GS__11 = (GS__11 + 1)) {
      let n = GS__9[GS__11];
      null;
      if ( (!true) ) {
        GS__10 = true;
      } else {
        null;
      }
      if ( ((!GS__10) && true) ) {
        delete mmap[n];
      }
    }
    null;
  }
  return mmap;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [truthy?] in file: stdlib.ky,line: 487
const truthy_QUERY = function(a) {
  return (!falsy_QUERY(a));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [falsy?] in file: stdlib.ky,line: 490
const falsy_QUERY = function(a) {
  return (((a === null)) || ((a === false)));
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
    return (((mv === null)) ?
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
////////////////////////////////////////////////////////////////////////////////
//fn: [wrap-str] in file: stdlib.ky,line: 539
const wrap_DASH_str = function(s) {
  let out = "\"";
  for (let i = 0, ch = "", sz = count(s), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    ch = s.charAt(i);
    if ( (ch === "\"") ) {
      out += "\\\"";
    } else {
      if ( (ch === "\n") ) {
        out += "\\n";
      } else {
        if ( (ch === "\t") ) {
          out += "\\t";
        } else {
          if ( (ch === "\f") ) {
            out += "\\f";
          } else {
            if ( (ch === "\r") ) {
              out += "\\r";
            } else {
              if ( (ch === "\v") ) {
                out += "\\v";
              } else {
                if ( (ch === "\\") ) {
                  out += (("u" === s.charAt((i + 1))) ?
                    ch :
                    "\\\\");
                } else {
                  if (true) {
                    out += ch;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return out += "\"";
};
////////////////////////////////////////////////////////////////////////////////
//fn: [unwrap-str] in file: stdlib.ky,line: 556
const unwrap_DASH_str = function(s) {
  return ((s.startsWith("\"") && s.endsWith("\"")) ?
    (function() {
      let out = "";
      s = s.slice(1, -1);
      for (let i = 0, nx = "", ch = "", sz = count(s), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
        ch = s.charAt(i);
        if ( (ch === "\\") ) {
          ++i;
          nx = s.charAt(i);
          if ( (nx === "\"") ) {
            out += "\"";
          } else {
            if ( (nx === "\\") ) {
              out += "\\";
            } else {
              if ( (nx === "n") ) {
                out += "\n";
              } else {
                if ( (nx === "t") ) {
                  out += "\t";
                } else {
                  if ( (nx === "f") ) {
                    out += "\f";
                  } else {
                    if ( (nx === "v") ) {
                      out += "\v";
                    } else {
                      if ( (nx === "r") ) {
                        out += "\r";
                      } else {
                        if (true) {
                          out += ch;
                          --i;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          out += ch;
        }
      }
      return out;
    }).call(this) :
    s);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [escXml] in file: stdlib.ky,line: 580
const escXml = function(s) {
  let out = "";
  for (let i = 0, c = null, sz = count(s), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    c = s[i];
    if ( (c === "&") ) {
      c = "&amp;";
    } else {
      if ( (c === ">") ) {
        c = "&gt;";
      } else {
        if ( (c === "<") ) {
          c = "&lt;";
        } else {
          if ( (c === "\"") ) {
            c = "&quot;";
          } else {
            if ( (c === "'") ) {
              c = "&apos;";
            } else {
              null;
            }
          }
        }
      }
    }
    out += c;
  }
  return out;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [split-seq] in file: stdlib.ky,line: 595
const split_DASH_seq = function(coll, cnt) {
  return ((cnt < count(coll)) ?
    [
      Array.prototype.slice.call(coll, 0, cnt),
      Array.prototype.slice.call(coll, cnt)
    ] :
    [
      Array.prototype.slice.call(coll, 0),
      []
    ]);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [select-keys] in file: stdlib.ky,line: 601
const select_DASH_keys = function(coll, keys) {
  return seq(keys).reduce(function(acc, n) {
    acc[[
      n
    ].join("")] = coll[[
      n
    ].join("")];
    return acc;
  }, {});
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doUpdateIn!] in file: stdlib.ky,line: 609
const doUpdateIn_BANG = function(coll, n, func, args, err) {
  let cur = (((typeof (n) === "number")) ?
    (((Array.isArray(coll)) && (n < coll.length)) ?
      coll[n] :
      err(n)) :
    (true ?
      coll[n] :
      null));
  let v = func.apply(this, cons(cur, args));
  return coll[n] = v;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [update-in!] in file: stdlib.ky,line: 619
const update_DASH_in_BANG = function(coll, keys, func) {
  let xs = Array.prototype.slice.call(arguments, 3);
  let err = function(k) {
    return (function() {
      throw new Error([
        "update-in! failed, bad nested keys: ",
        k
      ].join(""));
    }).call(this);
  };
  let root = coll;
  let end = (keys.length - 1);
  let m,
    n;
  for (let i = 0, ____break = false; ((!____break) && (i <= end)); i = (i + 1)) {
    n = keys[i];
    if ( (i === end) ) {
      doUpdateIn_BANG(root, n, func, xs, err);
    } else {
      if (( (typeof (n) === "number") )) {
        if ( (!((Array.isArray(root)) && (n < root.length))) ) {
          err(n);
        } else {
          root = root[n];
        }
      } else {
        if (true) {
          m = root[n];
          if (( (typeof (m) === "undefined") )) {
            m = {};
            root[n] = m;
          }
          if ( (!object_QUERY(m)) ) {
            err(n);
          } else {
            null;
          }
          root = m;
        }
      }
    }
  }
  return coll;
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
  keyword_DASH__GT_symbol: keyword_DASH__GT_symbol,
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
  assoc_BANG: assoc_BANG,
  dissoc_BANG: dissoc_BANG,
  truthy_QUERY: truthy_QUERY,
  falsy_QUERY: falsy_QUERY,
  m_DASH_identity: m_DASH_identity,
  m_DASH_maybe: m_DASH_maybe,
  m_DASH_array: m_DASH_array,
  m_DASH_state: m_DASH_state,
  m_DASH_continuation: m_DASH_continuation,
  wrap_DASH_str: wrap_DASH_str,
  unwrap_DASH_str: unwrap_DASH_str,
  escXml: escXml,
  split_DASH_seq: split_DASH_seq,
  select_DASH_keys: select_DASH_keys,
  update_DASH_in_BANG: update_DASH_in_BANG
};