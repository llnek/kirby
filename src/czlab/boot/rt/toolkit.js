// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var types = require("../bl/types");
var std = require("../bl/stdlib");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pr_str_A(arr) {
  return arr.map(function(e) { return types.pr_obj(e); });
}
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pr_str() {
  return pr_str_A(std.slice(arguments)).join(" ");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function str_A(arr) {
  return arr.map(function(e) { return types.pr_obj(e, false); });
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function str() {
  return str_A(std.slice(arguments)).join("");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function prn() {
  std.println.apply({}, pr_str_A(std.slice(arguments)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function println() {
  std.println.apply({}, str_A(std.slice(arguments)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function slurp(f) {
  return require("fs").readFileSync(f, "utf-8");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function timeMillis() { return new Date().getTime(); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function assoc(src) {
  return types.assoc.apply(this,
      [ types.clone(src) ].concat(std.slice(arguments, 1)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function dissoc(src) {
  return types.dissoc.apply(this,
    [ types.clone(src) ].concat(std.slice(arguments, 1)));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function cons(a, b) { return [a].concat(b); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function conj(arr) {
  if (types.list_p(arr)) {
    return std.slice(arguments, 1).reverse().concat(arr);
  } else if (arr) {
    let v = arr.concat(std.slice(arguments, 1));
    v.__isvector__ = true;
    return v;
  } else {
    return arr;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function seq(obj) {
  if (types.list_p(obj)) {
    return obj.length > 0 ? obj : null;
  }
  if (types.vector_p(obj)) {
    return obj.length > 0 ? std.slice(obj) : null;
  }
  if (std.string_p(obj)) {
    return obj.length > 0 ? obj.split("") : null;
  }
  if (obj === null) {
    return null;
  }
  std.raise("seq: called on non-sequence");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function apply(f) {
  let args = std.slice(arguments, 1),
      end=args.length-1;
  return f.apply(this,
                 args.slice(0, end).concat(args[end]));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function map(f, arr) {
  return arr.map(function(e){ return f(e); });
}
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var GLOBAL= typeof(window)==="undefined" ? undefined : window;
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
function withMeta(obj, m) {
  let ret = types.clone(obj); ret.__meta__ = m; return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function meta(obj) {
  if (!types.sequential_p(obj) &&
      !types.hashmap_p(obj) &&
      !types.object_p(obj) &&
      !std.function_p(obj)) {
    std.raise("attempt to get metadata from: ", types.obj_type(obj));
  }
  return obj.__meta__;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function deref(atm) { return atm.value; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function reset(atm, val) { return atm.value = val; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function swap(atm, f) {
  let args = [ atm.value ].concat(std.slice(arguments, 2));
  atm.value = f.apply(this, args);
  return atm.value;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function evalJS(str) {
  return filterJS(eval(str.toString()));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function invokeJS(method) {
  let args = std.slice(arguments, 1),
      r = resolveJS(method),
      obj = r[0],
      f = r[1],
      res = f.apply(obj, args);
  return filterJS(res);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var gensym_counter=types.atom(0);
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function gensym() {
  return types.symbol("G__" +
                      swap(gensym_counter,
                        function(x) { return x+1; }));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {

  "is-same?" : function (a,b) { return a==b;},

  "obj-type*" : types.obj_type,
  "gensym*" : gensym,

  "is-eq?" : types.eq_p,
  "is-nil??" : std.nil_p,
  "is-some?" : std.some_p,

  "throw*" : std.raise,
  "slice*" : std.slice,

  "#t" : std.true_p,
  "#f" : std.false_p,
  "is-str?" : std.string_p,

  "symbol" : types.symbol,
  "is-symbol?" : types.symbol_p,
  "keyword" : types.keyword,
  "is-keyword?" : types.keyword_p,

  "pr-str*" : pr_str,
  "str*" : str,
  "prn*" : prn,
  "println*" : println,
  "slurp*" : slurp,

  "<"  : function(a,b){return a<b;},
  "<=" : function(a,b){return a<=b;},
  ">"  : function(a,b){return a>b;},
  ">=" : function(a,b){return a>=b;},
  "+"  : function(a,b){return a+b;},
  "-"  : function(a,b){return a-b;},
  "*"  : function(a,b){return a*b;},
  "/"  : function(a,b){return a/b;},

  "time" : timeMillis,

  "list" : types.list,
  "is-list?" : types.list_p,

  "vector" : types.vector,
  "is-vector?" : types.vector_p,

  "hash-map" : types.hashmap,
  "is-map?" : types.hashmap_p,

  "assoc*" : assoc,
  "dissoc*" : dissoc,

  "is-contains?" : std.contains_p,
  "get*" : std.get,
  "keys*" : std.keys,
  "values*" : std.values,

  "dec*" : function(x) { return x-1; },
  "inc*" : function(x) { return x+1;},

  "is-not?" : function(x) { return x ? false : true },

  "is-even?" : std.even_p,
  "is-odd?" : std.odd_p,

  "is-sequential?" : types.sequential_p,
  "cons*" : cons,
  "concat*" : std.concat,
  "nth*" : std.nth,
  "first*" : std.first,
  "rest*" : std.rest,
  "is-empty?" : std.empty_p,
  "count*" : std.count,
  "apply*" : apply,
  "map*" : map,

  "type*" : std.isa,
  "evens*" : std.evens,
  "odds*" : std.odds,

  "conj*" : conj,
  "seq*" : seq,

  "with-meta*" : withMeta,
  "meta*" : meta,
  "atom*" : types.atom,
  "is-atom?" : types.atom_p,
  "deref*" : deref,
  "reset*" : reset,
  "swap*" : swap,

  "js-eval" : evalJS,
  "js#" : invokeJS

};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

