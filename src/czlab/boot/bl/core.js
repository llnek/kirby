// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var GLOBAL= typeof(window)==="undefined" ? undefined : window;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function slice(a,s,e) {
  return e ?
    Array.prototype.slice.call(a, s,e) :
    Array.prototype.slice.call(a, s);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function raise_E(e) { throw e; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function resolveJS(str) {
  if (str.match(/\./)) {
    let re = /^(.*)\.[^\.]*$/,
        mc = re.exec(str);
    return [eval(match[1]), eval(str)];
  } else {
    return [GLOBAL, eval(str)];
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function filterJS(obj) {
  if (!obj) {return null;}
  let cache=[];
  let s=JSON.stringify(obj, function(k, v) {
    if (v && typeof v === "object") {
      if (cache.indexOf(v) === -1) {
        cache.push(v);
      } else {
        //skip found object, avoid circular reference
        v=undefined;
      }
    }
    return v;
  });
  return JSON.parse(s);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function println() {
  console.log.apply(console, arguments);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pr_obj(obj, print_readably) {
  if (typeof print_readably === "undefined") { print_readably = true; }
  let _r = print_readably,
      ot = obj_type(obj);
  switch (ot) {
    case "list":
      return "(" + obj.map(function(e) {
                               return pr_obj(e,_r); }).join(" ") + ")";
    case "vector":
      return "[" + obj.map(function(e) {
                               return pr_obj(e,_r); }).join(" ") + "]";
    case "hash-map":
      return "{" + obj.map(function(e) {
                               return pr_obj(e,_r); }).join(" ") + "}";
    case "object":
      return "{" + Object.keys(obj).reduce(
                     function(acc, k) {
                           acc.push(pr_obj(k, _r),
                                    pr_obj(obj[k],_r)); return acc; }, []) + "}";
    case "string":
      if (_r) {
        return '"' + obj.
                     replace(/\\/g, "\\\\").
                     replace(/"/g, '\\"').
                     replace(/\n/g, "\\n") + '"';
      } else {
        return obj;
      }
    case "null":
      return "null";
    case "atom":
      return "(atom " + pr_obj(obj.value, _r) + ")";
    case "keyword":
      return ":" + obj.toString();
    default:
      return obj.toString();
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function undef_Q(x) { return typeof x === "undefined"; }
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function array_Q(x) { return Array.isArray(x); }
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function keys(x) { return Object.keys(x); }
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function obj_type(obj) {
  if (keyword_Q(obj)) { return "keyword"; }
  if (symbol_Q(obj)) { return "symbol"; }
  if (list_Q(obj)) { return "list"; }
  if (vector_Q(obj)) { return "vector"; }
  if (object_Q(obj)) { return "object"; }
  if (map_Q(obj)) { return "hash-map"; }
  if (nil_Q(obj)) { return "null"; }
  if (true_Q(obj)) { return "true"; }
  if (false_Q(obj)) { return "false"; }
  if (atom_Q(obj)) { return "atom"; }
  switch (typeof(obj)) {
    case "function": return "function";
    case "number":   return "number";
    case "string": return "string";
    default:
      throw new Error("Unknown type '" + typeof(obj) + "'");
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sequential_Q(arr) {
  return list_Q(arr) || vector_Q(arr); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function eq_Q (a, b) {
  let ota = obj_type(a),
      otb = obj_type(b);
  if (!(ota === otb ||
       (sequential_Q(a) && sequential_Q(b)))) {
    return false;
  }
  switch (ota) {
    case "symbol": return a.value === b.value;
    case "hash-map":
    case "list":
    case "vector":
      if (a.length !== b.length) { return false; }
      for (var i=0; i<a.length; ++i) {
        if (! eq_Q(a[i], b[i])) { return false; }
      }
      return true;
    case "object":
      if (keys(a).length !== keys(b).length) {
        return false; }
      for (var k in a) {
        if (!eq_Q(a[k], b[k])) { return false; }
      }
      return true;
    default:
      return a === b;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function clone (obj) {
  let ret;
  switch (obj_type(obj)) {
    case "list":
      ret = obj.slice(0);
      break;
    case "vector":
      ret = obj.slice(0);
      ret.__isvector__ = true;
      break;
    case "hash-map":
      ret = obj.slice(0);
      ret.__ismap__ = true;
      break;
    case "object":
      ret = {};
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) { ret[k] = obj[k]; }
      }
      break;
    case "function":
      ret = obj.clone();
      break;
    default:
      throw new Error("clone of non-collection: " + obj_type(obj));
  }
  Object.defineProperty(ret, "__meta__", {
    enumerable: false,
    writable: true
  });
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function nil_Q(a) { return a === null ? true : false; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function true_Q(a) { return a === true ? true : false; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function false_Q(a) { return a === false ? true : false; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function string_Q(obj) {
  return typeof obj === "string";
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function Keyword(name) {
  this.value = name.slice(1);
  return this;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function Symbol(name) {
  this.value = name;
  return this;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Symbol.prototype.toString = function() { return this.value; }
function symbol(name) { return new Symbol(name); }
function symbol_Q(obj) { return obj instanceof Symbol; }
function symbol_S(s) {
  return symbol_Q(s) ? s.value : s ? s.toString() :""; }
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Keyword.prototype.toString = function() { return this.value; }
function keyword(name) { return new Keyword(name); }
function keyword_Q(obj) { return obj instanceof Keyword; }
function keyword_S(k) {
  return keyword_Q(k) ? k.value : k ? k.toString() :""; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function fn_wrap(run, Env, ast, env, params) {
  let fn = function() {
    return run(ast, new Env(env, params, arguments));
  };
  fn._ismacro_ = false;
  fn.__meta__ = null;
  fn.__ast__ = ast;
  fn.__gen_env__ = function(args) {
                     return new Env(env, params, args); };
  return fn;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function function_Q(obj) { return typeof obj === "function"; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Function.prototype.clone = function() {
  let that = this,
      tmp = function () {
              return that.apply(this, arguments); };
  Object.keys(that).forEach(function(k){
    tmp[k] = that[k];
  });
  return tmp;
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function list() {
  return Array.prototype.slice.call(arguments, 0); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function list_Q(obj) {
  return Array.isArray(obj) &&
         !obj.__isvector__ && !obj.__ismap__; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function vector() {
  let v = Array.prototype.slice.call(arguments, 0);
  v.__isvector__ = true;
  return v;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function vector_Q(obj) {
  return Array.isArray(obj) && !!obj.__isvector__; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function map_Q(obj) {
  return Array.isArray(obj) && !!obj.__ismap__; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function hashmap() {
  if (arguments.length % 2 === 1) {
    throw new Error("Odd number of hash map arguments");
  }
  let args = [{}].concat(
             Array.prototype.slice.call(arguments, 0));
  return assoc_BANG.apply(this, args);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function object_Q(m) {
  return typeof m === "object" &&
         !Array.isArray(m) &&
         !(m === null) &&
         !(m instanceof Symbol) &&
         !(m instanceof Keyword) &&
         !(m instanceof Atom);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function assoc_BANG(m) {
  if (arguments.length % 2 !== 1) {
    throw new Error("Odd number of assoc arguments");
  }
  for (var i=1; i<arguments.length; i+=2) {
    let ktoken = arguments[i],
        vtoken = arguments[i+1];
    if (typeof ktoken !== "string") {
      throw new Error("expected object key string, got: " + (typeof ktoken));
    }
    m[ktoken] = vtoken;
  }
  return m;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function dissoc_BANG(m) {
  for (var i=1; i<arguments.length; ++i) {
    delete m[ arguments[i]];
  }
  return m;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function Atom(val) { this.value = val; }
function atom(val) { return new Atom(val); }
function atom_Q(atm) { return atm instanceof Atom; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {
  obj_type: obj_type,
  clone : clone,
  hashmap  : hashmap,
  symbol : symbol,
  keyword : keyword,
  vector : vector,
  list : list,
  atom  : atom,
  fn_wrap : fn_wrap,
  assoc_BANG : assoc_BANG,
  dissoc_BANG : dissoc_BANG,

  keyword_S : keyword_S,
  symbol_S : symbol_S,

  sequential_Q : sequential_Q,
  eq_Q : eq_Q,
  nil_Q : nil_Q,
  true_Q : true_Q,
  false_Q : false_Q,
  string_Q : string_Q,
  symbol_Q : symbol_Q,
  keyword_Q : keyword_Q,
  function_Q : function_Q,
  list_Q : list_Q,
  vector_Q : vector_Q,
  object_Q  : object_Q,
  atom_Q : atom_Q,
  undef_Q : undef_Q,
  array_Q : array_Q,
  map_Q : map_Q,

  println : println,
  pr_obj : pr_obj,

  slice : slice,
  raise_E : raise_E,

  resolveJS : resolveJS,
  filterJS: filterJS

};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

