// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var core = require("../bl/core");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pr_str_A(arr) {
  return arr.map(function(e) { return core.pr_obj(e, true); });
}
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pr_str() {
  return pr_str_A(core.slice(arguments)).join(" ");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function str_A(arr) {
  return arr.map(function(e) { return core.pr_obj(e, false); });
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function str() {
  return str_A(core.slice(arguments)).join("");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function prn() {
  core.println.apply({}, pr_str_A(core.slice(arguments)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function println() {
  core.println.apply({}, str_A(core.slice(arguments)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function slurp(f) {
  return require("fs").readFileSync(f, "utf-8");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function timeMillis() { return new Date().getTime(); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function typeof_Q(x) { return typeof x; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function assoc(src) {
  return core.assoc_B.apply(null,
      [ core.clone(src) ].concat(core.slice(arguments, 1)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function dissoc(src) {
  return core.dissoc_B.apply(null,
    [ core.clone(src) ].concat(core.slice(arguments, 1)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function get(m, key) {
  return (m && key in m) ? m[key] : undefined;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function contains_Q(m, key) {
  return (m && key in m);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function keys(m) { return Object.keys(m); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function vals(m) { return Object.values(m); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function cons(a, b) { return [a].concat(b); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function concat(arr) {
  arr = arr || [];
  return arr.concat.apply(arr, core.slice(arguments, 1));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function nth(arr, idx) {
  return (arr===null) ? null : arr[idx];
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function even_Q(n) { return (n % 2) === 0; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function odd_Q(n) { return !even_Q(n); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function first(arr) { return nth(arr,0); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function rest(arr) { return (arr == null) ? [] : arr.slice(1); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function empty_Q(arr) { return arr===null || arr.length === 0; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function count(s) {
  if (Array.isArray(s) || typeof s === "string") { return s.length; }
  if (s === null)  { return 0; }
  return Object.keys(s).length;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function conj(arr) {
  if (core.list_Q(arr)) {
    return core.slice(arguments, 1).reverse().concat(arr);
  } else {
    let v = arr.concat(core.slice(arguments, 1));
    v.__isvector__ = true;
    return v;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function seq(obj) {
  if (core.list_Q(obj)) {
    return obj.length > 0 ? obj : null;
  }
  if (core.vector_Q(obj)) {
    return obj.length > 0 ? core.slice(obj) : null;
  }
  if (core.string_Q(obj)) {
    return obj.length > 0 ? obj.split("") : null;
  }
  if (obj === null) {
    return null;
  }
  throw new Error("seq: called on non-sequence");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function apply(f,thisObj) {
  let args = core.slice(arguments, 1),
      end=args.length-1;
  return f.apply(thisObj,
                 args.slice(0, end).concat(args[end]));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function map(f, arr) {
  return arr.map(function(e){ return f(e); });
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function evens(arr) {
  let ret=[];
  arr= arr || [];
  for (var i=0; i < arr.length; i += 2) {
    ret.push(arr[i]);
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function odds(arr) {
  let ret=[];
  arr= arr || [];
  for (var i=1; i < arr.length; i += 2) {
    ret.push(arr[i]);
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function withMeta(obj, m) {
  let ret = core.clone(obj); ret.__meta__ = m; return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function meta(obj) {
  if (!core.sequential_Q(obj) &&
      !core.hashmap_Q(obj) &&
      !core.object_Q(obj) &&
      !core.function_Q(obj)) {
    throw new Error("attempt to get metadata from: " + core.obj_type(obj));
  }
  return obj.__meta__;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function deref(atm) { return atm.value; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function reset_BANG(atm, val) { return atm.value = val; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function swap_BANG(atm, f, thisObj) {
  let args = [ atm.value ].concat(core.slice(arguments, 2));
  atm.value = f.apply(thisObj, args);
  return atm.value;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function decr(n) { return n - 1; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function incr(n) { return n + 1; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function evalJS(str) {
  return filterJS(eval(str.toString()));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function invokeJS(method) {
  let args = core.slice(arguments, 1),
      r = resolveJS(method),
      obj = r[0],
      f = r[1],
      res = f.apply(obj, args);
  return filterJS(res);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function some_Q(x) {
  return typeof x !== "undefined" && x !== null;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {

  "type" : core.obj_type,
  "=" : core.eq_Q,
  "throw" : core.raise_E,
  "nil?" : core.nil_Q,
  "some?" : some_Q,

  "slice" : core.slice,

  "true?" : core.true_Q,
  "false?" : core.false_Q,
  "string?" : core.string_Q,
  "symbol" : core.symbol,
  "symbol?" : core.symbol_Q,
  "keyword" : core.keyword,
  "keyword?" : core.keyword_Q,

  "pr-str" : pr_str,
  "str" : str,
  "prn" : prn,
  "println" : println,
  "slurp" : slurp,

  "<"  : function(a,b){return a<b;},
  "<=" : function(a,b){return a<=b;},
  ">"  : function(a,b){return a>b;},
  ">=" : function(a,b){return a>=b;},
  "+"  : function(a,b){return a+b;},
  "-"  : function(a,b){return a-b;},
  "*"  : function(a,b){return a*b;},
  "/"  : function(a,b){return a/b;},
  "time" : timeMillis,

  "list" : core.list,
  "list?" : core.list_Q,
  "vector" : core.vector,
  "vector?" : core.vector_Q,
  "hash-map" : core.hashmap,
  "map?" : core.hashmap_Q,
  "assoc" : assoc,
  "dissoc" : dissoc,

  "get" : get,
  "contains?" : contains_Q,
  "keys" : keys,
  "values" : vals,

  "even?" : even_Q,
  "odd?" : odd_Q,

  "inc" : incr,
  "dec" : decr,

  "sequential?" : core.sequential_Q,
  "cons" : cons,
  "concat" : concat,
  "nth" : nth,
  "first" : first,
  "rest" : rest,
  "empty?" : empty_Q,
  "count" : count,
  "apply" : apply,
  "map" : map,

  "typeof?" : typeof_Q,
  "evens" : evens,
  "odds" : odds,

  "conj" : conj,
  "seq" : seq,

  "with-meta" : withMeta,
  "meta" : meta,
  "atom" : core.atom,
  "atom?" : core.atom_Q,
  "deref" : deref,
  "reset!" : reset_BANG,
  "swap!" : swap_BANG,

  "js-eval" : evalJS,
  "js#" : invokeJS

};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

