/*Auto generated by Kirby - v1.0.0 Fri Oct 13 2017 15:07:48 GMT-0700 (PDT)*/

;
//
function slice(arr,start,end) {
return (end ?
  Array.prototype.slice.call(arr,start,end) :
  Array.prototype.slice.call(arr,start));
}

//
function raise_BANG() {
let xs=Array.prototype.slice.call(arguments,0);
return (function (){ throw new Error(xs.join("")); }).call(this);
}

//
function trap_BANG() {
let xs=Array.prototype.slice.call(arguments,0);
return (function (){ throw xs.join(""); }).call(this);
}

//
function println() {
let xs=Array.prototype.slice.call(arguments,0);
return (console ?
  console.log.apply(console,xs) :
  null);
}

//
function get(m,key) {
return (contains_QUERY(m,key) ?
  m[key] :
  undefined);
}

//
function isa_QUERY(x) {
return typeof(x);
}

//
function undef_QUERY(x) {
return (typeof(x) === "undefined");
}

//
function array_QUERY(x) {
return Array.isArray(x);
}

//
function values(x) {
return Object.values(x);
}

//
function keys(x) {
return Object.keys(x);
}

//
function nil_QUERY(a) {
return (a === null);
}

//
function true_QUERY(a) {
return (true === a);
}

//
function false_QUERY(a) {
return (a === false);
}

//
function string_QUERY(x) {
return (typeof(x) === "string");
}

//
function number_QUERY(x) {
return (typeof(obj) === "number");
}

//
function fn_QUERY(x) {
return (typeof(obj) === "function");
}

//
function object_QUERY(m) {
return ((typeof(m) === "object")&&(!Array.isArray(m))&&(!(m === null)));
}

//
function even_QUERY(n) {
return (0 === (n%2));
}

//
function odd_QUERY(n) {
return (!even_QUERY(n));
}

//
function contains_QUERY(c,x) {
return (((Object.prototype.toString.call(c) === "[object Array]")||(typeof(c) === "string")) ?
  c.includes(x) :
  ((Object.prototype.toString.call(c) === "[object Object]") ?
    c.hasOwnProperty(x) :
    (true ?
      false :
      null)));
}

//
function nth(arr,idx) {
return (arr ?
  arr[idx] :
  undefined);
}

//
function first(arr) {
return arr[0];
}

//
function second(arr) {
return arr[1];
}

//
function rest(arr) {
return (arr ?
  arr.slice(1) :
  []);
}

//
function last(arr) {
return arr[(arr.length-1)];
}

//
function nichts_QUERY(arr) {
return ((typeof(arr) === "undefined")||(arr === null));
}

//
function empty_QUERY(arr) {
return (nichts_QUERY(arr)||(0 === arr.length));
}

//
function count(s) {
return ((Array.isArray(s)||(typeof(s) === "string")) ?
  s.length :
  ((s === null) ?
    0 :
    (true ?
      Object.keys(s).length :
      null)));
}

//
function not_empty(s) {
return (empty_QUERY(s) ?
  null :
  s);
}

//
function concat(arr) {
let a = (arr||[]);
return a.concat.apply(a,slice(arguments,1));
}

//
function evens(arr) {
return (function (ret) {
let a = (arr||[]);
(function () {
for (var i = 0; (i < a.length); i = (i+2)) {
    ret.push(arr[i]);
;
}
}).call(this);
return ret;
})([]);
}

//
function odds(arr) {
return (function (ret) {
let a = (arr||[]);
(function () {
for (var i = 1; (i < a.length); i = (i+2)) {
    ret.push(arr[i]);
;
}
}).call(this);
return ret;
})([]);
}

//
function some_QUERY(x) {
return ((!(typeof(x) === "undefined"))&&(x !== null));
}



module.exports = {
  slice: slice,
  raise_BANG: raise_BANG,
  trap_BANG: trap_BANG,
  println: println,
  get: get,
  isa_QUERY: isa_QUERY,
  undef_QUERY: undef_QUERY,
  array_QUERY: array_QUERY,
  values: values,
  keys: keys,
  nil_QUERY: nil_QUERY,
  true_QUERY: true_QUERY,
  false_QUERY: false_QUERY,
  string_QUERY: string_QUERY,
  number_QUERY: number_QUERY,
  fn_QUERY: fn_QUERY,
  object_QUERY: object_QUERY,
  even_QUERY: even_QUERY,
  odd_QUERY: odd_QUERY,
  contains_QUERY: contains_QUERY,
  nth: nth,
  first: first,
  second: second,
  rest: rest,
  last: last,
  nichts_QUERY: nichts_QUERY,
  empty_QUERY: empty_QUERY,
  count: count,
  not_empty: not_empty,
  concat: concat,
  evens: evens,
  odds: odds,
  some_QUERY: some_QUERY
};

