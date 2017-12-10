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
var std=require("./stdlib");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function wrap_str(s) {
  return '"' + s.replace(/\\/g, "\\\\").
                     replace(/"/g, '\\"').
                     replace(/\n/g, "\\n") + '"';
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function unwrap_str(s) {
  if (s.startsWith("\"") && s.endsWith("\"")) {
    return s.slice(1,s.length-1).
            replace(/\\"/g, '"').
            replace(/\\n/g, "\n").
            replace(/\\\\/g, "\\");
  } else {
    return s;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pr_obj(obj, readable) {
  let _r = readable || true,
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
      if (false && _r) {
        return wrap_str(obj);
      } else {
        return obj;
      }
    case "null":
      return "null";
    case "atom":
      return "(atom " + pr_obj(obj.value, _r) + ")";
    case "keyword":
      return "(Keyword :" + obj.toString()+ ")";
    case "symbol":
      return "(Symbol " + obj.toString() + ")";
    default:
      if (false && std.array_p(obj))
      return "(" +
        obj.map(function(e) {
          return pr_obj(e,_r); }).join(" ") + ")";
      else
      return obj.toString();
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function obj_type(obj) {
  if (keyword_p(obj)) { return "keyword"; }
  if (symbol_p(obj)) { return "symbol"; }
  if (list_p(obj)) { return "list"; }
  if (vector_p(obj)) { return "vector"; }
  if (object_p(obj)) { return "object"; }
  if (map_p(obj)) { return "hash-map"; }
  if (std.nil_p(obj)) { return "null"; }
  if (std.true_p(obj)) { return "true"; }
  if (std.false_p(obj)) { return "false"; }
  if (atom_p(obj)) { return "atom"; }
  if (std.function_p(obj)) { return "function"; }
  if (std.string_p(obj)) { return "string"; }
  if (std.number_p(obj)) { return "number"; }
  std.raise("Unknown type '", typeof(obj), "'");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function value_p(obj) {
  return (std.nil_p(obj) ||
          std.true_p(obj) ||
          vector_p(obj) ||
          map_p(obj) ||
          std.false_p(obj) ||
          std.string_p(obj) ||
          std.number_p(obj));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sequential_p(arr) {
  return list_p(arr) || vector_p(arr); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function eq_p (a, b) {
  let ota = obj_type(a),
      otb = obj_type(b);
  if (!(ota === otb ||
       (sequential_p(a) && sequential_p(b)))) {
    return false;
  }
  switch (ota) {
    case "keyword":
    case "symbol":
      return a.value === b.value;
    case "hash-map":
    case "list":
    case "vector":
      if (a.length !== b.length) { return false; }
      for (var i=0; i<a.length; ++i) {
        if (! eq_p(a[i], b[i])) { return false; }
      }
      return true;
    case "object":
      if (keys(a).length !== keys(b).length) {
        return false; }
      for (var k in a) {
        if (!eq_p(a[k], b[k])) { return false; }
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
      std.raise("clone of non-collection: ", obj_type(obj));
  }
  Object.defineProperty(ret, "__meta__", {
    enumerable: false,
    writable: true
  });
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function LambdaArg(name) {
  this.value = name.slice(1);
  if (this.value.length===0) { this.value="1"; }
  let v= parseInt(this.value);
  if (!(v > 0)) {
    throw new Error("Bad lambda-arg: " + name);
  }
  //zero based arg so minus 1
  --v;
  this.value= "" + v;
  return this;
}
function primitive(obj) {
  return new Primitive(obj);
}
function primitive_p(obj) {
  return obj instanceof Primitive;
}
function Primitive(v) {
  this.value = v;
  return this;
}
Primitive.prototype.toString=function() {
  return this.value.toString();
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
function regex(pattern) { return new Symbol(pattern); }
function symbol_p(obj) { return obj instanceof Symbol; }
function symbol_s(s) {
  return symbol_p(s) ? s.value : s ? s.toString() :""; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Keyword.prototype.toString = function() { return this.value; }
function keyword(name) { return new Keyword(name); }
function keyword_p(obj) { return obj instanceof Keyword; }
function keyword_s(k) {
  return keyword_p(k) ? k.value : k ? k.toString() :""; }
//
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
LambdaArg.prototype.toString = function() { return this.value; }
function lambda_arg(name) { return new LambdaArg(name); }
function lambda_arg_p(obj) { return obj instanceof LambdaArg; }
function lambda_arg_s(k) {
  return lambda_arg_p(k) ? k.value : k ? k.toString() :""; }

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
function list_p(obj) {
  return Array.isArray(obj) &&
         !obj.__isvector__ && !obj.__ismap__; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function vector() {
  let v = Array.prototype.slice.call(arguments, 0);
  v.__isvector__ = true;
  return v;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function vector_p(obj) {
  return Array.isArray(obj) && !!obj.__isvector__; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function map_p(obj) {
  return Array.isArray(obj) && !!obj.__ismap__; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function hashmap() {
  if (arguments.length % 2 === 1) {
    std.raise("Odd number of hash map arguments");
  }
  let args = [{}].concat(std.slice(arguments, 0));
  return assoc.apply(this, args);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function object_p(m) {
  return std.object_p(m) &&
         !(m instanceof Atom) &&
         !(m instanceof Symbol) &&
         !(m instanceof Keyword);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function assoc(m) {
  if (arguments.length % 2 !== 1) {
    std.raise("Odd number of assoc arguments");
  }
  for (var i=1; i<arguments.length; i+=2) {
    let ktoken = arguments[i],
        vtoken = arguments[i+1];
    if (!std.string_p(ktoken)) {
      std.raise("expected object key string, got: ", typeof(ktoken));
    }
    m[ktoken] = vtoken;
  }
  return m;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function dissoc(m) {
  for (var i=1; i<arguments.length; ++i) {
    delete m[ ""+ arguments[i]];
  }
  return m;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function Atom(val) { this.value = val; }
function atom(val) { return new Atom(val); }
function atom_p(atm) { return atm instanceof Atom; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {
  Atom: Atom,
  Keyword: Keyword,
  Symbol: Symbol,
  Primitive: Primitive,
  assoc: assoc,
  atom: atom,
  atom_p: atom_p,
  clone: clone,
  dissoc: dissoc,
  eq_p: eq_p,
  fn_wrap: fn_wrap,
  hashmap: hashmap,
  primitive: primitive,
  primitive_p: primitive_p,
  keyword: keyword,
  keyword_p: keyword_p,
  keyword_s: keyword_s,
  lambda_arg: lambda_arg,
  lambda_arg_p: lambda_arg_p,
  lambda_arg_s: lambda_arg_s,
  list: list,
  list_p: list_p,
  map_p: map_p,
  obj_type: obj_type,
  object_p: object_p,
  pr_obj: pr_obj,
  sequential_p: sequential_p,
  regex: regex,
  symbol: symbol,
  symbol_p: symbol_p,
  symbol_s: symbol_s,
  unwrap_str: unwrap_str,
  vector: vector,
  vector_p: vector_p,
  value_p : value_p,
  wrap_str: wrap_str

};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

