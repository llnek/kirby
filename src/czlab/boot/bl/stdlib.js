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
function slice(a,s,e) {
  return e ?
    Array.prototype.slice.call(a, s,e) :
    Array.prototype.slice.call(a, s);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function raise() {
  throw new Error(Array.prototype.slice.call(arguments,0).join(""));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function trap() {
  throw (Array.prototype.slice.call(arguments).join(""));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function println() {
  if (console) console.log.apply(console, arguments);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function get(m, key) {
  return (m && key in m) ? m[key] : undefined;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function isa(x) { return typeof(x); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function undef_p(x) { return typeof x === "undefined"; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function array_p(x) { return Array.isArray(x); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function values(x) { return Object.values(x); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function keys(x) { return Object.keys(x); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function nil_p(a) { return a === null; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function true_p(a) { return a === true;}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function false_p(a) { return a === false; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function string_p(obj) { return typeof obj === "string"; }
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function number_p(obj) { return typeof obj === "number"; }
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function function_p(obj) { return typeof obj === "function"; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function object_p(m) {
  return typeof m === "object" &&
         !Array.isArray(m) &&
         !(m === null);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function even_p(n) { return (n % 2) === 0; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function odd_p(n) { return !even_p(n); }

function contains_p(c, x) {
  if (array_p(c) || string_p(c)) {
    return c.includes(x);
  } else if (object_p(c)) {
    return c.hasOwnProperty(x);
  } else {
    return false;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function nth(arr, idx) { return (arr===null) ? null : arr[idx]; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function first(arr) { return nth(arr,0); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function rest(arr) { return (arr == null) ? [] : arr.slice(1); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function empty_p(arr) { return arr===null || arr.length === 0; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function count(s) {
  if (Array.isArray(s) || typeof s === "string") { return s.length; }
  if (s === null)  { return 0; }
  return Object.keys(s).length;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function not_empty(s) {
  return empty_p(s) ? null : s;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function concat(arr) {
  arr = arr || [];
  return arr.concat.apply(arr, slice(arguments, 1));
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
function some_p(x) {
  return typeof x !== "undefined" && x !== null;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {
  contains_p : contains_p,
  empty_p : empty_p,
  count : count,
  not_empty: not_empty,

  some_p: some_p,
  concat: concat,

  evens: evens,
  odds: odds,

  nth: nth,
  first: first,
  rest: rest,
  array_p : array_p,
  even_p: even_p,
  false_p : false_p,
  function_p: function_p,
  get: get,
  values: values,
  keys: keys,
  nil_p: nil_p,
  number_p: number_p,
  object_p : object_p,
  odd_p: odd_p,
  println: println,
  raise: raise,
  trap: trap,
  slice : slice,
  string_p : string_p,
  true_p : true_p,
  isa: isa,
  undef_p : undef_p
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

