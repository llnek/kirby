/*Auto generated by Kirby - v1.0.0 czlab.kirby.bl.stdlib Sat Nov 11 2017 20:15:32 GMT-0800 (PST)*/


//If coll is empty,
//returns nil, else coll
function not_DASH_empty(coll) {
  return ((0 === count(coll)) ?
    null :
    coll);
}

//JSON stringify without
//circular object reference
function stringify(obj) {
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
}

//If cur is not defined,
//returns other else returns cur
function opt_QUERY__QUERY(cur, other) {
  return ((typeof (cur) !== "undefined") ?
    cur :
    other);
}

//If coll is a list,
//prepends to head of coll
//else appends all to end
function conj_BANG(coll) {
  let xs = Array.prototype.slice.call(arguments, 1);
  if (list_QUERY(coll)) {
    coll.unshift.apply(coll, xs.reverse());
  } else {
    coll.push.apply(coll, xs);
  }
  return coll;
}

//Like conj! but
//returns a new collection
function conj(coll) {
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
}

//Removes the first element if list,
//else removes the last element,
//returning the element
//and the altered collection
function pop_BANG(coll) {
  let r = (list_QUERY(coll) ?
    coll.shift() :
    coll.pop());
  return [r, coll];
}

//Like pop! but returns a new collection
function pop(coll) {
  let r = (list_QUERY(coll) ?
    coll[0] :
    last(coll));
  return [r,(list_QUERY(coll) ?
    coll.slice(1) :
    coll.slice(0, -1))];
}

//Print the input data as string
function prn(obj) {
  let G____1 = Array.prototype.slice.call(arguments, 1);
  let G____2 = G____1;
  let readable_QUERY;
  readable_QUERY = G____2[0];
  let _r = opt_QUERY__QUERY(readable_QUERY, true);
  let pa = function(arr, s, e) {
    return [s, arr.map(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return prn(____args[0], _r);
    }).join(" "), e].join("");
  };
  return (function() {
    let S____3;
    switch (typeid(obj)) {
      case "lambda-arg":
        S____3 = ["%",(parseInt(obj.value) + 1)].join("");
        break;
      case "atom":
        S____3 = ["(atom ", prn(obj.value, _r), ")"].join("");
        break;
      case "keyword":
        S____3 = [":", obj.value].join("");
        break;
      case "symbol":
        S____3 = obj.value;
        break;
      case "object":
        S____3 = stringify(obj);
        break;
      case "vector":
        S____3 = pa(obj, "[", "]");
        break;
      case "map":
        S____3 = pa(obj, "{", "}");
        break;
      case "array":
      case "list":
        S____3 = pa(obj, "(", ")");
        break;
      case "string":
        S____3 = obj;
        break;
      case "null":
      case "nil":
        S____3 = "null";
        break;
      default:
        S____3 = obj.toString();
        break;
    }
    return S____3;
  }).call(this);
}

//Defining a lambda positional argument
class LambdaArg {
  constructor(arg) {
    this["value"] = "";
    let name = ((arg === "%") ?
      "1" :
      arg.slice(1));
    let v = parseInt(name);
    if ( (!(v > 0)) ) {
      throw new Error(["Bad lambda-arg: ", arg].join(""));
    }
    --v;
    this.value = [v].join("");
    return this;
  }

  toString() {
    return this.value;
  }

}

//Defining a primitive data type
class Primitive {
  constructor(v) {
    this["value"] = null;
    this.value = v;
    return this;
  }

  toString() {
    return this.value;
  }

}

//Defining a keyword
class Keyword {
  constructor(name) {
    this["value"] = "";
    this.value = name.slice(1);
    return this;
  }

  toString() {
    return this.value;
  }

}

//Defining a symbol
class Symbol {
  constructor(name) {
    this["value"] = "";
    this.value = name;
    return this;
  }

  toString() {
    return this.value;
  }

}

//Returns true if primitive
function primitive_QUERY(obj) {
  return (obj instanceof Primitive);
}

//Create a Primitive
function primitive(v) {
  return new Primitive(v);
}

//Returns true if a symbol
function symbol_QUERY(obj) {
  return (obj instanceof Symbol);
}

//Create a new Symbol
function symbol(name) {
  return new Symbol(name);
}

//Returns true if a keyword
function keyword_QUERY(obj) {
  return (obj instanceof Keyword);
}

//Create a new Keyword
function keyword(name) {
  return new Keyword(name);
}

//Returns true if a Lambda Arg
function lambda_DASH_arg_QUERY(obj) {
  return (obj instanceof LambdaArg);
}

//Create a new Lambda Arg
function lambda_DASH_arg(name) {
  return new LambdaArg(name);
}

//Defining a clojure-like Atom
class Atom {
  constructor(val) {
    this["value"] = null;
    this.value = val;
    return this;
  }

}

//Returns true if an Atom
function atom_QUERY(atm) {
  return (atm instanceof Atom);
}

//Create a new Atom
function atom(val) {
  return new Atom(val);
}

//Set a new value to the Atom
function reset_BANG(a, v) {
  return a.value = v;
}

//Get value inside the Atom
function deref(a) {
  return a.value;
}

//Change value inside the Atom,
//returning the new value
function swap_BANG(a, f) {
  let xs = Array.prototype.slice.call(arguments, 2);
  a.value = f.apply(this, [a.value].concat(xs));
  return a["value"];
}

//Returns the type-id of this object
function typeid(obj) {
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
}

//Returns true if a simple value
function value_QUERY(obj) {
  return ((obj === null) || vector_QUERY(obj) || list_QUERY(obj) || map_QUERY(obj) || (false === obj) || (true === obj) || (typeof (obj) === "string") || (typeof (obj) === "number"));
}

//Returns true if coll
//implements Sequential
function sequential_QUERY(arr) {
  return (Array.isArray(arr) && (!map_QUERY(arr)));
}

//Tests if two things are equal
function eq_QUERY(a, b) {
  let ta = typeid(a);
  let tb = typeid(b);
  return ((!((ta === tb) || (sequential_QUERY(a) && sequential_QUERY(b)))) ?
    false :
    (function() {
      let S____4;
      switch (ta) {
        case "map":
        case "list":
        case "vector":
          S____4 = (function() {
            let ok_QUERY = true;
            if ( (a.length !== b.length) ) {
              ok_QUERY = false;
            } else {
              for (let i = 0, ____break = false; ((!____break) && (i < a.length)); i = (i + 1)) {
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
          S____4 = (function() {
            let ok_QUERY = true;
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
          S____4 = (a.value === b.value);
          break;
        default:
          S____4 = (a === b);
          break;
      }
      return S____4;
    }).call(this));
}

//Returns true if a js object
function object_QUERY(obj) {
  return ((!((obj === null) || Array.isArray(obj))) ?
    (typeof (obj) === "object") :
    null);
}

//Returns the last element
function last(coll) {
  return (coll ?
    coll[(coll.length - 1)] :
    null);
}

//Returns a typed collection
function into_BANG(type, coll) {
  {
    let S____5;
    switch (type) {
      case "vector":
        S____5 = coll["____vec"] = true;
        break;
      case "list":
        S____5 = coll["____list"] = true;
        break;
      case "map":
        S____5 = coll["____map"] = true;
        break;
    }
  }
  return coll;
}

//Like into! but returning a new collection
function into(type, coll) {
  return into_BANG(type, coll.slice(0));
}

//Returns true if a LISP list, not data
function pairs_QUERY(obj) {
  return (Array.isArray(obj) && (!vector_QUERY(obj)) && (!map_QUERY(obj)) && (!list_QUERY(obj)));
}

//Returns true if a List
function list_QUERY(obj) {
  return (Array.isArray(obj) && obj.____list);
}

//Create a List
function list() {
  let xs = Array.prototype.slice.call(arguments, 0);
  xs["____list"] = true;
  return xs;
}

//Returns true if a Vector
function vector_QUERY(obj) {
  return (Array.isArray(obj) && obj.____vec);
}

//Create a Vector
function vector() {
  let xs = Array.prototype.slice.call(arguments, 0);
  xs["____vec"] = true;
  return xs;
}

//Returns true if a Hashmap
function map_QUERY(obj) {
  return (Array.isArray(obj) && obj.____map);
}

//Create a new Hashmap
function hashmap() {
  let xs = Array.prototype.slice.call(arguments, 0);
  if ( (!(0 === (xs.length % 2))) ) {
    throw new Error("Odd number of hash map arguments");
  }
  xs["____map"] = true;
  return xs;
}

//Returns a sequence
function seq(obj) {
  return ((typeof (obj) === "string") ?
    obj.split("") :
    (Array.isArray(obj) ?
      obj.slice(0) :
      (object_QUERY(obj) ?
        Object.entries(obj) :
        null)));
}

//Returns true if item is inside
function contains_QUERY(coll, x) {
  return ((Array.isArray(coll) || (typeof (coll) === "string")) ?
    coll.includes(x) :
    (object_QUERY(coll) ?
      coll.hasOwnProperty(x) :
      null));
}

//Returns true if object is
//either null of undefined
function nichts_QUERY(obj) {
  return ((typeof (obj) === "undefined") || (obj === null));
}

//Returns true if object is
//defined and not null
function some_QUERY(obj) {
  return ((typeof (obj) !== "undefined") && (null !== obj));
}

//Count the number of elements inside
function count(coll) {
  return (coll ?
    (((typeof (coll) === "string") || Array.isArray(coll)) ?
      coll :
      Object.keys(coll)).length :
    0);
}

//Add many to this collection
function concat_STAR(coll) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return (coll ?
    coll.concat.apply(coll, xs) :
    null);
}

//
function every(coll, start, step) {
  let ret = [];
  for (let i = start, ____break = false; ((!____break) && (i < coll.length)); i = (i + step)) {
    conj_BANG(ret, coll[i]);
  }
  return ret;
}

//Collect every 2nd item starting at 0
function evens(coll) {
  return every(coll, 0, 2);
}

//Collect every 2nd item starting at 1
function odds(coll) {
  return every(coll, 1, 2);
}

//Returns a seq of the first item
//in each coll, then the second, etc
function interleave(c1, c2) {
  let cz = ((c2.length < c1.length) ?
    c2.length :
    c1.length);
  let ret = [];
  for (let i = 0, ____break = false; ((!____break) && (i < cz)); i = (i + 1)) {
    conj_BANG(ret, c1[i], c2[i]);
  }
  return ret;
}

//Returns a map with the
//keys mapped to the corresponding vals
function zipmap(keys, vals) {
  let cz = ((keys.length < vals.length) ?
    keys.length :
    vals.length);
  let ret = {};
  for (let i = 0, ____break = false; ((!____break) && (i < cz)); i = (i + 1)) {
    ret[[keys[i]].join("")] = vals[i];
  }
  return ret;
}

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
    return Array.prototype.slice.call(arguments).reduce(function(acc, v) {
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
  interleave: interleave,
  zipmap: zipmap,
  m_DASH_identity: m_DASH_identity,
  m_DASH_maybe: m_DASH_maybe,
  m_DASH_array: m_DASH_array,
  m_DASH_state: m_DASH_state,
  m_DASH_continuation: m_DASH_continuation
};

