/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Copyright © 2013-2021, Kenneth Leung. All rights reserved. */
"use strict";
//////////////////////////////////////////////////////////////////////////////
const __module_namespace__ = "czlab.kirby.stdlib";
const MODULE_NAMESPACE = "__module_namespace__";
const MAX_DASH_INT = Number.MAX_SAFE_INTEGER;
const MIN_DASH_INT = Number.MIN_SAFE_INTEGER;
//////////////////////////////////////////////////////////////////////////////
//Write msg to console.
function println(...msgs){
  if(console) console.log(msgs.join(""));
  return null;
}
//////////////////////////////////////////////////////////////////////////////
//If coll is empty, returns nil, else coll.
function not_DASH_empty(coll){
  return 0 === count(coll) ? null : coll
}
//////////////////////////////////////////////////////////////////////////////
//Use a cache to store already referenced objects
//to prevent circular references.
function noCRef(){
  let cache = [];
  return function(k,v){
    if(typeof(v) == "function"){
      v= "native-fn"
    }else if(Object.prototype.toString.call(v) == "[object Map]" ||
             object_QMRK(v) ||
             Object.prototype.toString.call(v) == "[object Set]"){
      if(contains_QMRK(cache, v)){
        v = undefined
      }else{
        cache.push(v)
      }
    }
    return v;
  };
}
//////////////////////////////////////////////////////////////////////////////
//JSON stringify (no cyclical obj-ref)
function stringify(obj){
  return obj ? JSON.stringify(obj, noCRef()) : null;
}
//////////////////////////////////////////////////////////////////////////////
//If cur is not defined, returns other else cur
function opt_QMRK__QMRK(cur, other){
  return typeof (cur) != "undefined" ? cur : other
}
//////////////////////////////////////////////////////////////////////////////
//Adds one element to the beginning of a collection.
function cons_BANG(x, coll){
  if(coll) coll.unshift(x);
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
//conj[oin]. Returns coll with the xs
//'added'. (conj! nil item) returns [item].
//If coll is a list, prepends else appends to coll.
function conj_BANG(coll,...xs){
  if(nichts_QMRK(coll)){
    conj_BANG.apply(this, [[]].concat(xs))
  }else if(Array.isArray(coll)){
    if(list_QMRK(coll)){
      coll.unshift.apply(coll, xs.reverse())
    }else{
      coll.push.apply(coll, xs)
    }
  }else if(Object.prototype.toString.call(coll) == "[object Set]"){
    xs.forEach(a=>coll.add(a))
  }else{
    throw new Error(["Cannot conj to: ", typeof (coll)].join(""))
  }
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
//Like conj! but
//returns a new collection
function conj(coll,...xs){
  let c=null;
  if(Array.isArray(coll)){
    if(vector_QMRK(coll)){
      c=into("vector", coll)
    }else if(list_QMRK(coll)){
      c=into("list", coll)
    }else if(map_QMRK(coll)){
      c=into("map", coll)
    }else if(obj_QMRK(coll)){
      c=into("obj", coll)
    }else if(set_QMRK(coll)){
      c=into("set", coll)
    }else{
      c=Array.prototype.slice.call(coll)
    }
  }else if(Object.prototype.toString.call(coll) == "[object Set]"){
    c=new Set(coll.values())
  }else if(nichts_QMRK(coll)){
    c=[]
  }
  return c ? conj_BANG.apply(this, [c].concat(xs)) : coll;
}
//////////////////////////////////////////////////////////////////////////////
//disj[oin]. Returns a set without these keys
function disj_BANG(coll,...xs){
  if(Object.prototype.toString.call(coll) == "[object Set]"){
    xs.forEach(a=>coll.delete(a))
  }
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
//disj[oin]. Returns a new set without these keys
function disj(coll,...xs){
  let s2 = new Set(xs);
  let s=[]
  if(Object.prototype.toString.call(coll) == "[object Set]"){
    s= (Array.from(coll.values()) || []).filter(a=> !s2.has(a))
  }
  return new Set(s);
}
//////////////////////////////////////////////////////////////////////////////
//Removes the first element if list,
//else removes the last element,
//returning the element
//and the altered collection
function pop_BANG(coll){
  let rc=null;
  if(Array.isArray(coll)){
    let r = list_QMRK(coll) ? coll.shift() : coll.pop();
    rc= [r, coll];
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
//Like pop! but returns a new collection
function pop(coll){
  let rc=null;
  if(Array.isArray(coll)){
    let r = list_QMRK(coll) ? coll[0] : last(coll);
    rc= [r,list_QMRK(coll) ? coll.slice(1) : coll.slice(0, -1)];
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
//Prepend and append strings to the object.
function wrap_DASH_str(obj, start, end){
  return [start, obj, end].join("")
}
//////////////////////////////////////////////////////////////////////////////
function getIndex(obj, pos){
  if(Array.isArray(obj)) return obj[pos]
}
//////////////////////////////////////////////////////////////////////////////
//If prop is a string, returns the value of
//this object property, obeying the own? flag,
//unless if object is a Map, returns value of
//the key. Otherwise, return the value at the
//index of the array.
function getProp(obj, prop, own_QMRK){
  let rc;
  if(Object.prototype.toString.call(obj) == "[object Map]"){
    rc=obj.get(prop)
  }else if(!nichts_QMRK(obj)){
    own_QMRK = opt_QMRK__QMRK(own_QMRK, true);
    if(typeof(prop) == "string" || typeof(prop) == "number"){
      if(own_QMRK && typeof(prop) == "string" && !obj.hasOwnProperty(prop)){}else{
        rc=obj[prop]
      }
    }
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
//Print data as string - use to dump an AST node
function prn(obj,r_QMRK){
  let f = noCRef();
  if(complex_QMRK(obj)){
    obj = f(null, obj)
  }
  return obj ? prn_STAR(obj, r_QMRK, f) : "";
}
//////////////////////////////////////////////////////////////////////////////
//Print an array
function prnArr_STAR(obj, r_QMRK, f){
  return (obj || []).map((v, i)=> prn_STAR(opt_QMRK__QMRK(f(i,v), null), r_QMRK, f)).join(" ")
}
//////////////////////////////////////////////////////////////////////////////
function prn_STAR(obj, r_QMRK, func){
  let pfx = function(a){ return prn_STAR(a, r_QMRK, func) };
  let parr = Array.isArray(obj) ? function(a,b){
                                    return wrap_DASH_str(prnArr_STAR(obj, r_QMRK, func), a,b) } : null;
  let c3;
  switch(typeid(obj)){
    case "atom":
      c3 = wrap_DASH_str(pfx(obj.value), "(atom ", ")");
      break;
    case "lambda-arg":
    case "regex-obj":
    case "keyword":
    case "symbol":
      c3 = obj.value;
      break;
    case "object":
      c3 = wrap_DASH_str((seq(obj) || []).reduce(function(acc, GS__4){
        let [k,v] = GS__4;
        let x= func(k, v);
        if(typeof(x) != "undefined")
          conj_BANG(acc, [pfx(k), ":", pfx(x)].join(""));
        return acc;
      }, []).join(","), "{", "}");
      break;
    case "objectMap":
      c3 = wrap_DASH_str((seq(obj) || []).reduce(function(acc, GS__5){
        let [k,v] = GS__5;
        let x = func(k, v);
        if(typeof(x) != "undefined")
          conj_BANG(acc, [pfx(k), " ", pfx(x)].join(""));
        return acc;
      }, []).join(" "), "{", "}");
      break;
    case "objectSet":
      c3 = wrap_DASH_str((seq(obj) || []).reduce(function(acc, v){
        let x = func(v, v);
        if(typeof(x) != "undefined") conj_BANG(acc, pfx(v));
        return acc;
      }, []).join(" "), "#{", "}");
      break;
    case "vector":
      c3 = parr("[", "]");
      break;
    case "map":
    case "obj":
      c3 = parr("{", "}");
      break;
    case "set":
      c3 = parr("#{", "}");
      break;
    case "list":
      c3 = parr("'(", ")");
      break;
    case "string":
      c3 = r_QMRK ? quote_DASH_str(obj) : obj;
      break;
    case "null":
    case "nil":
      c3 = "null";
      break;
    default:
      c3 = Array.isArray(obj) ? parr("(", ")") : obj.toString();
      break;
  }
  return c3;
}
//Defining a lambda positional argument
class LambdaArg{
  constructor(arg){
    let name= arg == "%" ? "1" : arg.slice(1);
    let v = parseInt(name);
    if(!(v>0))
      throw new Error(`invalid lambda-arg ${arg}`);
    this.value = `%${v}`;
  }
  toString(){
    return this.value
  }
}
//Defining a primitive data type
class Primitive {
  constructor(v){
    this.value = v
  }
  toString(){
    return this.value
  }
}
//Defining a Regex pattern
class RegexObj{
  constructor(v){
    this.value = v
  }
  toString(){
    return this.value
  }
}
//Defining a keyword
class Keyword{
  constructor(name){
    this.value = name
  }
  toString(){
    return this.value.startsWith("::") ?
      [_STAR_ns_STAR(), "/", this.value.slice(2)].join("") :
      this.value.startsWith(":") ? this.value.slice(1) : null;
  }
}
//Defining a symbol
class Symbol{
  constructor(name){
    this.value = name
  }
  toString(){
    return this.value
  }
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if primitive
function primitive_QMRK(obj){
  return obj instanceof Primitive
}
//////////////////////////////////////////////////////////////////////////////
//Create a Primitive
function primitive(v){
  return new Primitive(v)
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a regex
function regexObj_QMRK(obj){
  return obj instanceof RegexObj
}
//////////////////////////////////////////////////////////////////////////////
//Create a new regex
function regexObj(name){
  return new RegexObj(name)
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a symbol
function symbol_QMRK(obj){
  return obj instanceof Symbol
}
//////////////////////////////////////////////////////////////////////////////
//Create a new Symbol
function symbol(name){
  return new Symbol(name)
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a keyword
function keyword_QMRK(obj){
  return obj instanceof Keyword
}
//////////////////////////////////////////////////////////////////////////////
//Create a new Keyword
function keyword(name){
  return new Keyword(name)
}
//////////////////////////////////////////////////////////////////////////////
//Convert a Keyword to Symbol
function keyword_DASH__GT_symbol(k){
  let s = new Symbol([k].join(""));
  s.source = k.source;
  s.line = k.line;
  s.column = k.column;
  return s;
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a Lambda Arg
function lambdaArg_QMRK(obj){
  return obj instanceof LambdaArg
}
//////////////////////////////////////////////////////////////////////////////
//Create a new Lambda Arg
function lambdaArg(name){
  return new LambdaArg(name)
}
//Defining a clojure-like Atom
class Atom{
  constructor(val){
    this.value = val
  }
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if an Atom
function atom_QMRK(atm){
  return atm instanceof Atom
}
//////////////////////////////////////////////////////////////////////////////
//Create a new Atom
function atom(val){
  return new Atom(val)
}
//////////////////////////////////////////////////////////////////////////////
//Set a new value to the Atom
function reset_BANG(a, v){
  a.value=v;
  return null;
}
////////////////////////////////////////////////////////////////////////////////
function resetVec_BANG(v){
  if(Array.isArray(v)) v.splice(0);
  return null;
}
//////////////////////////////////////////////////////////////////////////////
function resetMap_BANG(obj){
  if(Object.prototype.toString.call(obj) == "[object Map]") obj.clear();
  return null;
}
//////////////////////////////////////////////////////////////////////////////
function resetSet_BANG(obj){
  if(Object.prototype.toString.call(obj) == "[object Set]") obj.clear();
  return null;
}
//////////////////////////////////////////////////////////////////////////////
function resetObject_BANG(obj){
  if(object_QMRK(obj))
    Object.getOwnPropertyNames(obj).forEach(a => delete obj[a]);
  return null;
}
//////////////////////////////////////////////////////////////////////////////
function objClass(obj){
  return obj ? obj.constructor : null
}
//////////////////////////////////////////////////////////////////////////////
//Returns a sorted sequence of the items in coll.
//If no comparator is supplied, uses compare
function sort_BANG(comp, coll){
  return typeof(comp) == "function" ? coll.sort(comp) : comp.sort()
}
//////////////////////////////////////////////////////////////////////////////
//Get value inside the Atom
function deref(a){
  return a.value
}
//////////////////////////////////////////////////////////////////////////////
function a_len(obj){
  return obj && obj.length ? obj.length : 0
}
//////////////////////////////////////////////////////////////////////////////
//Change value inside the Atom,
//returning the new value
function swap_BANG(a, f,...xs){
  a.value = f.apply(this, [a.value].concat(xs));
  return getProp(a, "value");
}
//////////////////////////////////////////////////////////////////////////////
//Returns the type-id
//of this object
function typeid(obj){
  let s="";
  if(lambdaArg_QMRK(obj)){
    s="lambda-arg"
  }else if(keyword_QMRK(obj)){
    s="keyword"
  }else if(symbol_QMRK(obj)){
    s="symbol"
  }else if(vector_QMRK(obj)){
    s="vector"
  }else if(atom_QMRK(obj)){
    s="atom"
  }else if(list_QMRK(obj)){
    s="list"
  }else if(map_QMRK(obj)){
    s="map"
  }else if(obj_QMRK(obj)){
    s="obj"
  }else if(set_QMRK(obj)){
    s="set"
  }else if(obj === null){
    s="null"
  }else if(obj === true){
    s="true"
  }else if(obj === false){
    s="false"
  }else if(typeof(obj) == "function"){
    s="function"
  }else if(typeof(obj) == "string"){
    s="string"
  }else if(typeof(obj) == "number"){
    s="number"
  }else if(Array.isArray(obj)){
    s="array"
  }else if(object_QMRK(obj)){
    s="object"
  }else if(Object.prototype.toString.call(obj) == "[object Set]"){
    s="objectSet"
  }else if(Object.prototype.toString.call(obj) == "[object Map]"){
    s="objectMap"
  }else{
    throw new Error(`Unknown type [${typeof(obj)}]`);
  }
  return s;
}
//////////////////////////////////////////////////////////////////////////////
//True if x is an array
//or js object.
function complex_QMRK(x){
  return Array.isArray(x) ||
         object_QMRK(x) ||
         Object.prototype.toString.call(x) == "[object Map]" ||
         Object.prototype.toString.call(x) == "[object Set]"
}
//////////////////////////////////////////////////////////////////////////////
//True if x is a
//primitive value type
function simple_QMRK(obj){
  return typeof(obj) == "undefined" ||
         obj === null ||
         obj === false ||
         obj === true ||
         typeof(obj) == "string" ||
         typeof(obj) == "number"
}
////////////////////////////////////////////////////////////////////////////////
//Returns true
//if a simple LISP value
function value_QMRK(obj){
  return obj === null ||
         vector_QMRK(obj) ||
         list_QMRK(obj) ||
         map_QMRK(obj) ||
         obj_QMRK(obj) ||
         set_QMRK(obj) ||
         obj === false ||
         obj === true ||
         typeof(obj) == "string" ||
         typeof(obj) == "number"
}
//////////////////////////////////////////////////////////////////////////////
//True if coll
//implements Sequential
function sequential_QMRK(arr){
  return Array.isArray(arr) && !set_QMRK(arr) && !obj_QMRK(arr) && !map_QMRK(arr)
}
//////////////////////////////////////////////////////////////////////////////
function set2Set(s){
  let ret = new Set();
  for(let i=0, sz= count(s);  i<sz; ++i){
    ret.add(s[i])
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function eqSets_QMRK(s1, s2){
  let ok=false;
  if(s1.size === s2.size){
    ok=true;
    s1.forEach((v, k)=>{
      if(!s2.has(v)) ok=false })
  }
  return ok;
}
//////////////////////////////////////////////////////////////////////////////
function map2Map(m){
  let ret = new Map();
  for(let i=0, end=count(m); i<end; i +=2){
    ret.set(m[i], m[i+1])
  }
  return ret;
}
////////////////////////////////////////////////////////////////////////////////
function eqMaps_QMRK(m1, m2){
  let ok= false;
  if(m1.size === m2.size){
    ok=true;
    m1.forEach((v, k)=>{
      if(!eq_QMRK(m2.get(k), v)) ok=false })
  }
  return ok;
}
//////////////////////////////////////////////////////////////////////////////
function map2Obj(m){
  let ret={};
  for(let k,i=0, end=count(m); i<end; i +=2){
    k= m[i];
    ret[[k].join("")] = m[i+1];
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//True if both are equal
function eq_QMRK(a,b){
  let ok=true;
  if(map_QMRK(a) && map_QMRK(b) && a_len(a)===a_len(b)){
    ok=eq_QMRK(map2Map(a), map2Map(b))
  }else if(obj_QMRK(a) && obj_QMRK(b) && a_len(a)===a_len(b)){
    ok=eq_QMRK(map2Obj(a),map2Obj(b))
  }else if(isJSArray(a) && isJSArray(b) && a_len(a)===a_len(b)){
    for(let i=0,end=a_len(a);i<end;++i){
      if(!eq_QMRK(a[i],b[i])){
        ok=false;
        break;
      }
    }
    ok
  }else if(set_QMRK(a) && set_QMRK(b) && a_len(a)===a_len(b)){
    ok=eqSets_QMRK(set2Set(a), set2Set(b))
  }else if(inst_QMRK(LambdaArg, a) && inst_QMRK(LambdaArg,b)){
    ok= a.value == b.value
  }else if(inst_QMRK(Symbol, a) && inst_QMRK(Symbol, b)){
    ok= a.value == b.value
  }else if(inst_QMRK(Keyword,a) && inst_QMRK(Keyword,b)){
    ok= a.value== b.value
  }else if(object_QMRK(a) && object_QMRK(b) && count(a)== count(b)){
    for(k in Object.keys(a))
      if(!eq_QMRK(get(a,k),get(b,k))){
        ok=false;
        break;
      }
  }else if(isObjectMap(a) && isObjectMap(b)){
    ok= eqMaps_QMRK(a, b)
  }else if(isObjectSet(a) && isObjectSet(b)){
    ok= eqSets_QMRK(a,b)
  }else{
    ok= a===b
  }
  return ok;
}
function isObjectMap(obj){
  return Object.prototype.toString.call(obj) == "[object Map]"
}
function isObjectSet(obj){
  return Object.prototype.toString.call(obj) == "[object Set]"
}
function isString(obj){
  return typeof(obj)== "string"
}
function isJSArray(obj){
  return Array.isArray(obj)
}
//////////////////////////////////////////////////////////////////////////////
//Returns true
//if a js object
function object_QMRK(obj){
  return (obj === null ||
          Object.prototype.toString.call(obj) == "[object Map]" ||
          Object.prototype.toString.call(obj) == "[object Set]" ||
          Array.isArray(obj)) ? null : typeof(obj) == "object";
}

//////////////////////////////////////////////////////////////////////////////
//Returns the last element
function last(coll){
  return Array.isArray(coll) && coll.length>0 ? coll[(coll.length-1)] : null
}
//////////////////////////////////////////////////////////////////////////////
//Assign a type to this collection
function into_BANG(type, coll){
  coll["____typeid"] = type;
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
//Like into! but
//returning a new collection
function into(type, coll){
  return Array.isArray(coll) ? into_BANG(type, coll.slice(0)) : null
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if
//a LISP list, not data
function pairs_QMRK(obj){
  return Array.isArray(obj) &&
         !vector_QMRK(obj) &&
         !set_QMRK(obj) && !obj_QMRK(obj) && !map_QMRK(obj) && !list_QMRK(obj);
}
////////////////////////////////////////////////////////////////////////////////
//Returns true if a List
function list_QMRK(obj){
  return Array.isArray(obj) && obj.____typeid == "list"
}
////////////////////////////////////////////////////////////////////////////////
//Create a List
function list(...xs){
  xs["____typeid"] = "list";
  return xs;
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a Vector
function vector_QMRK(obj){
  return Array.isArray(obj) && obj.____typeid == "vector"
}
//////////////////////////////////////////////////////////////////////////////
//Create a Vector
function vector(...xs){
  xs["____typeid"] = "vector";
  return xs;
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a Set
function set_QMRK(obj){
  return Array.isArray(obj) && obj.____typeid == "set"
}
//////////////////////////////////////////////////////////////////////////////
//Create a Set
function set(...xs){
  xs["____typeid"] = "set";
  return xs;
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a Hashmap
function map_QMRK(obj){
  return Array.isArray(obj) && obj.____typeid == "map"
}
//////////////////////////////////////////////////////////////////////////////
//Returns true if a Object
function obj_QMRK(obj){
  return Array.isArray(obj) && obj.____typeid == "obj"
}
//////////////////////////////////////////////////////////////////////////////
//Create a new array map
function arraymap(...xs){
  if(modulo(xs.length, 2) !== 0){
    throw new Error("Invalid arity for arraymap")
  }
  xs["____typeid"] = "map";
  return xs;
}
//////////////////////////////////////////////////////////////////////////////
//Create a new js object
function object(...xs){
  if(modulo(xs.length, 2) !== 0){
    throw new Error("Invalid arity for object")
  }
  return zipobj(evens(xs), odds(xs));
}
//////////////////////////////////////////////////////////////////////////////
//Returns a sequence
function seq(obj){
  let rc;
  if(isString(obj)){
    rc=obj.split("")
  }else if(isJSArray(obj)){
    rc=obj.slice(0)
  }else if(isObjectSet(obj)){
    rc=Array.from(obj.values)
  }else if(isObjectMap(obj)){
    rc= Array.from(obj.entries)
  }else if(object_QMRK(obj)){
    rc= Object.entries(obj)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a seq of the items in coll in reverse order. If rev is empty returns nil.
function rseq(coll){
  return Array.isArray(coll) ? seq(coll).reverse() : null
}
//////////////////////////////////////////////////////////////////////////////
//True if item is inside
function contains_QMRK(coll, x){
  let rc=false;
  if(isJSArray(coll) || isString(coll)){
    rc=coll.includes(x)
  }else if(isObjectSet(coll)){
    rc=coll.has(x)
  }else if(isObjectMap(coll)){
    rc=coll.has(x)
  }else if(object_QMRK(coll)){
    rc=coll.hasOwnProperty(x)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
//True if object is
//either null of undefined
const nichts_QMRK = function(obj) {
  return (((typeof (obj) === "undefined")) || ((obj === null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [some?] in file: stdlib.ky, line: 1509
//True if object is
//defined and not null
function some_QMRK(obj){
  return !nichts_QMRK(obj)
}
//////////////////////////////////////////////////////////////////////////////
//Count the number of elements inside
function count(coll){
  let n=0;
  if(coll){
    if(isObjectMap(coll) || isObjectSet(coll)){
      n=coll.size
    }else{
      n=a_len(isString(coll) || isJSArray(coll) ? coll : Object.keys(coll))
    }
  }
  return n;
}
////////////////////////////////////////////////////////////////////////////////
//Add many to this collection
function concat_STAR(coll,...xs){
  return coll ? coll.concat.apply(coll, xs) : null
}
//////////////////////////////////////////////////////////////////////////////
function repeat_DASH_every(coll, start, step){
  let ret = [];
  for(let i=start,end=count(coll); i<end; i += step){
    conj_BANG(ret, coll[i])
  }
  return ret;
}
////////////////////////////////////////////////////////////////////////////////
//Collect every
//2nd item starting at 0
function evens(coll){
  return repeat_DASH_every(coll, 0, 2)
}
//////////////////////////////////////////////////////////////////////////////
//Collect every
//2nd item starting at 1
function odds(coll){
  return repeat_DASH_every(coll, 1, 2)
}
//////////////////////////////////////////////////////////////////////////////
//Modulo
function modulo(x, N){
  return x<0 ? (x - (-1 * (N + (Math.floor(((-1 * x) / N)) * N)))) : (x % N)
}
//////////////////////////////////////////////////////////////////////////////
//Returns a sequence of lists of n items each.
function partition(n, coll){
  let recur = null;
  let _x_ = null;
  function _f_(ret, GS_9){
    let [x,y]=GS_9;
    if(not_DASH_empty(x)){ ret.push(x) }
    return 0 === count(y) ? ret : recur(ret, split_DASH_seq(y, n))
  }
  let _r_ = _f_;
  recur=function(...xs){
    if(_r_){
      for(_r_ = undefined; _r_ === undefined;){
        _r_= _f_.apply(this,xs)
      }
      return _r_;
    }
  };
  return recur([], split_DASH_seq(coll, n))
}
//////////////////////////////////////////////////////////////////////////////
//Splits string on a sep or regular expression.  Optional argument limit is
//the maximum number of splits. Returns vector of the splits.
function split(s, re,limit){
  return typeof(limit) != "undefined" ? s.split(re, limit) : s.split(re)
}
//////////////////////////////////////////////////////////////////////////////
//Returns a sequence of strings of n characters each.
function split_DASH_str(n, string){
  let ret = [];
  for(let i=0,end=count(string); i<end; i += n){
    ret.push(string.substr(i, n))
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a seq of the first item
//in each coll, then the second, etc
function interleave(c1, c2){
  let cz = c2.length < c1.length ? c2.length : c1.length;
  let ret = [];
  for(let i=0,end=cz; i<end; ++i){
    conj_BANG(ret, c1[i], c2[i])
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Returns an object with the
//keys mapped to the corresponding vals
function zipmap(keys, vals){
  let cz=keys.length < vals.length ? keys.length : vals.length;
  let ret = new Map([]);
  for(let i=0,end=cz; i<end; ++i){
    assoc_BANG(ret, keys[i], vals[i])
  }
  return ret;
}
////////////////////////////////////////////////////////////////////////////////
//Returns an object with the
//keys mapped to the corresponding vals
function zipobj(keys, vals){
  let cz=keys.length<vals.length ? keys.length : vals.length;
  let ret = {};
  for(let i=0,end=cz; i<end; i+=1){
    assoc_BANG(ret, [keys[i]].join(""), vals[i])
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function extendAttr(obj, attr,flags){
  flags=opt_QMRK__QMRK(flags, { "enumerable": false, "writable": true});
  Object.defineProperty(obj, attr, flags);
  return obj;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a new seq where x is the first element and seq is
//the rest.
function cons(x, coll){
  return Array.isArray(coll) ? [x].concat(coll) : null
}
const gensym_DASH_counter = atom(0);
//////////////////////////////////////////////////////////////////////////////
//Generates next random symbol
function gensym(pfx){
  return symbol([opt_QMRK__QMRK(pfx, "GS__"), swap_BANG(gensym_DASH_counter, x=>x+1)].join(""))
}
//////////////////////////////////////////////////////////////////////////////
function carve(coll,start,end){
  return typeof(end) != "undefined" ? coll.slice(start, end) : typeof(start) != "undefined" ? coll.slice(start) : coll.slice()
}
////////////////////////////////////////////////////////////////////////////////
function assoc_BANG(obj,...xs){
  if(obj){
    for(let k,v,i=0,end=count(xs); i<end; i += 2){
      k = xs[i];
      v = xs[i+1];
      if(Object.prototype.toString.call(obj) == "[object Map]"){
        obj.set(k, v)
      }else if(object_QMRK(obj)){
        obj[k] = v
      }
    }
  }
  return obj;
}
//////////////////////////////////////////////////////////////////////////////
function dissoc_BANG(obj,...xs){
  if(obj){
    for(let k,i=0, sz=count(xs); i<sz; ++i){
      k = xs[i];
      if(Object.prototype.toString.call(obj) == "[object Map]"){
        obj.delete(k)
      }else if(object_QMRK(obj)){
        delete obj[k]
      }
    }
  }
  return obj;
}
//////////////////////////////////////////////////////////////////////////////
//LISP truthy
function truthy_QMRK(a){
  return !falsy_QMRK(a)
}
//////////////////////////////////////////////////////////////////////////////
//LISP falsy
function falsy_QMRK(a){
  return a === null || a === false
}
//////////////////////////////////////////////////////////////////////////////
//Flatten an array
function flatten(xs){
  return (xs || []).reduce(function(acc, v){ return acc.concat(v) }, [])
}
//////////////////////////////////////////////////////////////////////////////
//Returns its argument.
function identity(x){
  return x
}
const m_DASH_identity = {
  plus:undefined,
  zero:undefined,
  unit:function(a){ return a },
  bind:function(mv, mf){ return mf(mv) }
};
const m_DASH_maybe={
  zero:undefined,
  plus:undefined,
  unit:function(a){ return a },
  bind:function(mv, mf){ return mv !== null ? mf(mv) : null }
};
const m_DASH_list={
  plus:function(...xs){ return flatten(xs) },
  zero: [],
  unit:function(a){ return [a] },
  bind:function(mv, mf){ return flatten((mv || []).map(mf)) }
};
const m_DASH_state={
  zero:undefined,
  plus:undefined,
  unit:function(v){ return (a)=>[v, a] },
  bind:function(mv, mf){ return (s)=>{ let [v, ns]=mv(s); return mf(v)(ns) }}
};
const m_DASH_continuation={
  zero:undefined,
  plus:undefined,
  unit:function(v){ return (cont)=>cont(v) },
  bind:function(mv, mf){ return (cont)=> mv((v)=> mf(v)(cont)) }
};
//////////////////////////////////////////////////////////////////////////////
//Execute the computation cont
//in the cont monad and return its result.
function run_DASH_cont(cont){
  return cont(identity)
}
//////////////////////////////////////////////////////////////////////////////
//Add quotes around a string
function quote_DASH_str(s){
  let ch,out = "\"";
  for(let i=0,end=count(s); i<end; ++i){
    ch= s.charAt(i);
    if(ch === "\""){
      out += "\\\""
    }else if(ch === "\n"){
      out += "\\n"
    }else if(ch == "\t"){
      out += "\\t"
    }else if(ch == "\f"){
      out += "\\f"
    }else if(ch == "\r"){
      out += "\\r"
    }else if(ch == "\v"){
      out += "\\v"
    }else if(ch == "\\"){
      out += "u" === s.charAt(i+1) ? ch : "\\\\"
    }else{
      out += ch
    }
  }
  return out += "\"";
}
//////////////////////////////////////////////////////////////////////////////
//Removes quotes around a string
function unquote_DASH_str(s){
  if(typeof(s) == "string" && s.startsWith("\"") && s.endsWith("\"")){
    let out=""
    s= s.slice(1, -1);
    for(let nx,ch,i=0,end=count(s);i<end;++i){
      ch=s.charAt(i);
      if(ch=== "\\"){
        ++i;
        nx=s.charAt(i);
        if(nx=== "\""){
          out += "\""
        }else if(nx=== "\\"){
          out += "\\"
        }else if(nx=== "n"){
          out += "\n"
        }else if(nx=== "t"){
          out += "\t"
        }else if(nx=== "f"){
          out += "\f"
        }else if(nx=== "v"){
          out += "\v"
        }else if(nx=== "r"){
          out += "\r"
        }else {
          --i;
          out += ch;
        }
      }else{
        out += ch
      }
    }
    s=out;
  }
  return s;
}
//////////////////////////////////////////////////////////////////////////////
//Escape XML special chars
function escXml(s){
  let out = "";
  for(let c,i=0,sz=count(s); i<sz; ++i){
    c=s[i];
    if(c === "&"){
      c = "&amp;"
    }else if(c === ">"){
      c = "&gt;"
    }else if(c === "<"){
      c = "&lt;"
    }else if(c === "\""){
      c = "&quot;"
    }else if(c === "'"){
      c = "&apos;"
    }
    out += c
  }
  return out;
}
//////////////////////////////////////////////////////////////////////////////
//Split a collection into 2 parts
function split_DASH_seq(coll, cnt){
  return cnt < count(coll) ? [coll.slice(0, cnt), coll.slice(cnt)] : [coll.slice(0), []]
}
////////////////////////////////////////////////////////////////////////////////
//Get a subset of keys
function select_DASH_keys(coll, keys){
  return (seq(keys) || []).reduce((acc, n)=> assoc_BANG(acc, n, coll.get(n)), new Map())
}
////////////////////////////////////////////////////////////////////////////////
function doUpdateIn_BANG(coll, n, func, args, err){
  let v,cur;
  if(number_QMRK(n)){
    cur= isJSArray(coll) && n< a_len(coll)? coll[n] : err(n)
  }else{
    cur=coll.get(n)
  }
  return assoc_BANG(coll, n, func.apply(this, cons(cur, args)))
}
//////////////////////////////////////////////////////////////////////////////
//'Updates' a value in a nested associative structure, where ks is a
//sequence of keys and f is a function that will take the old value
//and any supplied args and return the new value, and returns a new
//nested structure.  If any levels do not exist, hash-maps will be
//created.
function update_DASH_in_BANG(coll, keys, func,...xs){
  function err(a){ throw new Error(`update-in! failed, bad nested keys: ${a}`) }
  let m,root = coll;
  let end= keys.length-1;
  for(let n,i=0,end=count(keys); i<=end; i += 1){
    n = keys[i];
    if(i === end){
      doUpdateIn_BANG(root, n, func, xs, err)
    }else if(typeof(n) == "number"){
      if(!(Array.isArray(root) && n<root.length)){
        err(n)
      }else{
        root = root[n]
      }
    }else{
      m = root.get(n);
      if(typeof(m) == "undefined"){
        assoc_BANG(root, n, m = new Map())
      }
      if(Object.prototype.toString.call(m) != "[object Map]"){
        err(n)
      }
      root = m
    }
  }
  return coll;
}
////////////////////////////////////////////////////////////////////////////////
//Returns the value in a nested associative structure,
//where ks is a sequence of keys. Returns nil if the key
//is not present, or the not-found value if supplied.
function get_DASH_in(coll, keys){
  let root = coll;
  let ret = null;
  let end = keys.length-1;
  for(let n,i=0; i <= end; i += 1){
    n= keys[i];
    if(typeof(n) == "number"){
      if(!(Array.isArray(root) && n < root.length)){
        ret = null;
        break;
      }
      root = root[n];
      ret = root;
    }else{
      root = root.get(n);
      ret = root;
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function merge_BANG(base, m){
  let ret = base || new Map();
  let src = m || new Map();
  function loop(v, k){
    return assoc_BANG(ret, k, v)
  }
  if(object_QMRK(src)){
    Object.keys(src).forEach(p=> loop(getProp(src, p), p))
  }else{
    src.forEach(loop)
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function mix_BANG(base, m){
  let ret = base || {};
  let src = m || {};
  function loop(v, k){
    return (ret[k] = v)
  }
  if(object_QMRK(src)){
    Object.keys(src).forEach(p=> loop(getProp(src, p), p))
  }else{
    src.forEach(loop)
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a map that consists of the rest of the maps conj-ed onto
//the first.  If a key occurs in more than one map, the mapping from
//the latter (left-to-right) will be the mapping in the result.
function merge(...xs){
  return (xs || []).reduce((acc, n)=> merge_BANG(acc, n) , new Map())
}
////////////////////////////////////////////////////////////////////////////////
//Returns an object that consists of the rest of the objects conj-ed onto
//the first.  If a property occurs in more than one object, the mapping from
//the latter (left-to-right) will be the mapping in the result.
function mixin(...objs){
  return (objs || []).reduce((acc, n)=> mix_BANG(acc, n) , {})
}
//////////////////////////////////////////////////////////////////////////////
function fillArray(len, v){
  let ret = [];
  for(let x=0; x < len; ++x){
    ret.push(typeof(v) == "function" ? v(x) : v)
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function copyArray(src, des){
  let sz = Math.min(count(src), count(des));
  for(let i=0,end=sz; i<end; i += 1){
    des[i] = src[i]
  }
  return des;
}
////////////////////////////////////////////////////////////////////////////////
//Creates a clone of the given JavaScript array.
//The result is a new array, which is a shallow copy.
function aclone(src){
  return Array.isArray(src) ? src.slice(0) : null
}
//////////////////////////////////////////////////////////////////////////////
//Return a set that is the first set
//without elements of the other set.
function difference(a, b){
  let ret = [];
  for(let z,i = 0,sz = count(a); i < sz; ++i){
    z = a[i];
    if(!contains_QMRK(b, z)){
      conj_BANG(ret, z)
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a number one greater than x.
function inc(x){
  return x+1
}
//////////////////////////////////////////////////////////////////////////////
//Returns a number one lesser than x.
function dec(x){
  return x-1
}
//////////////////////////////////////////////////////////////////////////////
function percent(numerator, denominator){
  return 100 * (numerator / denominator)
}
//////////////////////////////////////////////////////////////////////////////
function toFixed(num, digits){
  return Number(num).toFixed(opt_QMRK__QMRK(digits, 2))
}
//////////////////////////////////////////////////////////////////////////////
function mapcat(func, coll){
  let ret = [];
  return ret.concat.apply(ret, (coll || []).map(func))
}
//////////////////////////////////////////////////////////////////////////////
function ensureTest(cnd, msg){
  msg = msg || "test";
  try{
    return `${cnd ? "passed:" : "FAILED:"} ${msg}`
  }catch(e){
    return `FAILED: ${msg}`
  }
}
//////////////////////////////////////////////////////////////////////////////
function ensureTestThrown(expected, error, msg){
  return error === null ?
    `FAILED: ${msg}` :
    (expected == typeof(error) || expected == "any") ? `passed: ${msg}` : `FAILED: ${msg}`
}
//////////////////////////////////////////////////////////////////////////////
function runtest(test,title){
  let now = new Date();
  let results = test();
  let sum = count(results);
  let ok = count((results || []).filter(a=> a.startsWith("p")));
  let ps = toFixed(percent(ok, sum));
  title = opt_QMRK__QMRK(title, "test");
  return ["+".repeat(78), title, now,
          "+".repeat(78), results.join("\n"),
          "=".repeat(78),
          `Passed: ${ok}/${sum} [${ps}%]`,
          `Failed: ${sum - ok}`,
          `CPU Time: ${new Date() - now}ms`].join("\n")
}
const _STAR_ns_DASH_cache_STAR = atom([new Map([["id", "user"], ["meta", null]])]);
//////////////////////////////////////////////////////////////////////////////
function pushNSP(nsp,info){
  let obj=new Map([["id", nsp], ["meta", info]]);
  return swap_BANG(_STAR_ns_DASH_cache_STAR, function(a){
    a.unshift(obj);
    return a;
  })
}
//////////////////////////////////////////////////////////////////////////////
function popNSP(){
  return swap_BANG(_STAR_ns_DASH_cache_STAR, function(a){
    a.shift();
    return a;
  })
}
//////////////////////////////////////////////////////////////////////////////
function peekNSP(){
  return _STAR_ns_DASH_cache_STAR.value[0]
}
//////////////////////////////////////////////////////////////////////////////
function _STAR_ns_STAR(){
  let n = peekNSP();
  return typeof(n) == "undefined" || n === null ? null : getProp(n, "id")
}
//////////////////////////////////////////////////////////////////////////////
function minBy(func, coll){
  if(not_DASH_empty(coll))
    return (coll.slice(1) || []).reduce((a,b)=> (func(a) < func(b)) ? a : b, coll[0])
}
//////////////////////////////////////////////////////////////////////////////
function maxBy(func, coll){
  if(not_DASH_empty(coll))
    return (coll.slice(1) || []).reduce((a,b)=> (func(a) < func(b)) ? b : a, coll[0])
}
//////////////////////////////////////////////////////////////////////////////
//Returns a sequence of successive items from coll while
//(pred item) returns logical true. pred must be free of side-effects.
function take_DASH_while(pred,coll){
  let ret = [];
  for(let c,i=0,end=count(coll); i<end; i+=1){
    c = coll[i];
    if(pred(c)){
      ret.push(c)
    }else{
      break}
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a sequence of the items in coll starting from the
//first item for which (pred item) returns logical false.
function drop_DASH_while(pred, coll){
  let ret = [];
  for(let c,i=0,end=count(coll); i<end; ++i){
    c = coll[i];
    if(!pred(c)){
      ret = coll.slice(i);
      break;
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Returns a vector of [(take-while pred coll) (drop-while pred coll)]
function split_DASH_with(pred, coll){
  return [take_DASH_while(pred, coll), drop_DASH_while(pred, coll)]
}
//////////////////////////////////////////////////////////////////////////////
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.stdlib",
    vars: ["MODULE_NAMESPACE", "MAX-INT", "MIN-INT", "println", "not-empty", "stringify", "opt??", "cons!", "conj!", "conj", "disj!", "disj", "pop!", "pop", "wrap-str", "getIndex", "getProp", "prn", "LambdaArg", "Primitive", "RegexObj", "Keyword", "Symbol", "primitive?", "primitive", "regexObj?", "regexObj", "symbol?", "symbol", "keyword?", "keyword", "keyword->symbol", "lambdaArg?", "lambdaArg", "Atom", "atom?", "atom", "reset!", "resetVec!", "resetMap!", "resetSet!", "resetObject!", "objClass", "sort!", "deref", "swap!", "typeid", "complex?", "simple?", "value?", "sequential?", "eq?", "object?", "last", "into!", "into", "pairs?", "list?", "list", "vector?", "vector", "set?", "set", "map?", "obj?", "arraymap", "object", "seq", "rseq", "contains?", "nichts?", "some?", "count", "concat*", "evens", "odds", "modulo", "partition", "split", "split-str", "interleave", "zipmap", "zipobj", "extendAttr", "cons", "gensym", "carve", "assoc!", "dissoc!", "truthy?", "falsy?", "flatten", "identity", "m-identity", "m-maybe", "m-list", "m-state", "m-continuation", "run-cont", "quote-str", "unquote-str", "escXml", "split-seq", "select-keys", "update-in!", "get-in", "merge", "mixin", "fillArray", "copyArray", "aclone", "difference", "inc", "dec", "percent", "toFixed", "mapcat", "ensureTest", "ensureTestThrown", "runtest", "pushNSP", "popNSP", "peekNSP", "*ns*", "minBy", "maxBy", "take-while", "drop-while", "split-with"],
    macros: {
      "this-as": "(macro* this-as (that & body) (syntax-quote (let [(unquote that) this] (splice-unquote body))))",
      "trye!": "(macro* trye! (& xs) (syntax-quote (try (splice-unquote xs) (catch ewroewrwe null))))",
      "empty?": "(macro* empty? (coll) (syntax-quote (= 0 (kirbystdlibref/count (unquote coll)))))",
      "starts-with?": "(macro* starts-with? (s arg) (syntax-quote (.startsWith (unquote s) (unquote arg))))",
      "ends-with?": "(macro* ends-with? (s arg) (syntax-quote (.endsWith (unquote s) (unquote arg))))",
      "n#": "(macro* n# (coll) (syntax-quote (kirbystdlibref/count (unquote coll))))",
      "1st": "(macro* 1st (x) (syntax-quote (first (unquote x))))",
      "_1": "(macro* _1 (x) (syntax-quote (first (unquote x))))",
      "2nd": "(macro* 2nd (x) (syntax-quote (second (unquote x))))",
      "_2": "(macro* _2 (x) (syntax-quote (second (unquote x))))",
      "3rd": "(macro* 3rd (x) (syntax-quote (nth (unquote x) 2)))",
      "_3": "(macro* _3 (x) (syntax-quote (nth (unquote x) 2)))",
      "trap!": "(macro* trap! (& msgs) (let* [sz (count* msgs)] (if* (> sz 1) (syntax-quote (throw (join \"\" (vec (splice-unquote msgs))))) (if* (> sz 0) (syntax-quote (throw (unquote (nth* msgs 0)))) (syntax-quote (throw \"error!\"))))))",
      "merror": "(macro* merror (e) (syntax-quote (new Error (unquote e))))",
      "raise!": "(macro* raise! (& msgs) (let* [sz (count* msgs)] (if* (> sz 1) (syntax-quote (throw (merror (join \"\" (vec (splice-unquote msgs)))))) (if* (> sz 0) (syntax-quote (throw (merror (unquote (nth* msgs 0))))) (syntax-quote (throw (merror \"error!\")))))))",
      "slice": "(macro* slice (arr start end) (if* end (syntax-quote (Array.prototype.slice.call (unquote arr) (unquote start) (unquote end))) (if* start (syntax-quote (Array.prototype.slice.call (unquote arr) (unquote start))) (syntax-quote (Array.prototype.slice.call (unquote arr))))))",
      "numStr": "(macro* numStr (n) (syntax-quote (.toString (Number (unquote n)))))",
      "float": "(macro* float (x) (syntax-quote (parseFloat (unquote x))))",
      "int": "(macro* int (x) (syntax-quote (parseInt (unquote x))))",
      "delay": "(macro* delay (f t) (syntax-quote (setTimeout (unquote f) (unquote t))))",
      "break-out-of-loop!": "(macro* break-out-of-loop! () (syntax-quote (set! ____break true)))",
      "undef!": "(macro* undef! (x) (syntax-quote (set! (unquote x) undefined)))",
      "nil!": "(macro* nil! (x) (syntax-quote (set! (unquote x) null)))",
      "last-index": "(macro* last-index (coll) (syntax-quote (-1 (alen (unquote coll)))))",
      "rest": "(macro* rest (coll) (syntax-quote (.slice (unquote coll) 1)))",
      "cdr": "(macro* cdr (coll) (syntax-quote (.slice (unquote coll) 1)))",
      "second": "(macro* second (coll) (syntax-quote (nth (unquote coll) 1)))",
      "first": "(macro* first (coll) (syntax-quote (nth (unquote coll) 0)))",
      "car": "(macro* car (coll) (syntax-quote (nth (unquote coll) 0)))",
      "nexth": "(macro* nexth (coll i) (syntax-quote (nth (unquote coll) (1 (unquote i)))))",
      "nth": "(macro* nth (coll i) (syntax-quote (aget (unquote coll) (unquote i))))",
      "even?": "(macro* even? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= 0 (kirbystdlibref/modulo (unquote x) 2)))) xs)))))",
      "odd?": "(macro* odd? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (not (even? (unquote x))))) xs)))))",
      "alen": "(macro* alen (coll) (syntax-quote (.-length (unquote coll))))",
      "nzlen?": "(macro* nzlen? (coll) (syntax-quote (> (alen (unquote coll)) 0)))",
      "zlen?": "(macro* zlen? (coll) (syntax-quote (= (alen (unquote coll)) 0)))",
      "type": "(macro* type (obj) (syntax-quote (typeof (unquote obj))))",
      "whatis?": "(macro* whatis? (obj) (syntax-quote (Object.prototype.toString.call (unquote obj))))",
      "regex?": "(macro* regex? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (whatis? (unquote x)) \"[object RegExp]\"))) xs)))))",
      "array?": "(macro* array? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (Array.isArray (unquote x)))) xs)))))",
      "arr?": "(macro* arr? (& xs) (syntax-quote (array? (splice-unquote xs))))",
      "date?": "(macro* date? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (whatis? (unquote x)) \"[object Date]\"))) xs)))))",
      "objectMap?": "(macro* objectMap? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (whatis? (unquote x)) \"[object Map]\"))) xs)))))",
      "objectSet?": "(macro* objectSet? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (whatis? (unquote x)) \"[object Set]\"))) xs)))))",
      "bool?": "(macro* bool? (& xs) (syntax-quote (boolean? (splice-unquote xs))))",
      "boolean?": "(macro* boolean? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (typeof (unquote x)) \"boolean\"))) xs)))))",
      "num?": "(macro* num? (& xs) (syntax-quote (number? (splice-unquote xs))))",
      "number?": "(macro* number? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (typeof (unquote x)) \"number\"))) xs)))))",
      "str?": "(macro* str? (& xs) (syntax-quote (string? (splice-unquote xs))))",
      "string?": "(macro* string? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (typeof (unquote x)) \"string\"))) xs)))))",
      "fn?": "(macro* fn? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (typeof (unquote x)) \"function\"))) xs)))))",
      "undef?": "(macro* undef? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (typeof (unquote x)) \"undefined\"))) xs)))))",
      "def?": "(macro* def? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (not= (typeof (unquote x)) \"undefined\"))) xs)))))",
      "nil?": "(macro* nil? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (unquote x) null))) xs)))))",
      "zero?": "(macro* zero? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (unquote x) 0))) xs)))))",
      "one?": "(macro* one? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (unquote x) 1))) xs)))))",
      "neg?": "(macro* neg? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (< (unquote x) 0))) xs)))))",
      "pos?": "(macro* pos? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (> (unquote x) 0))) xs)))))",
      "vals": "(macro* vals (obj) (syntax-quote (Array.from (.values (unquote obj)))))",
      "keys": "(macro* keys (obj) (syntax-quote (Array.from (.keys (unquote obj)))))",
      "properties": "(macro* properties (obj) (syntax-quote (Object.getOwnPropertyNames (unquote obj))))",
      "enumerables": "(macro* enumerables (obj) (syntax-quote (Object.keys (unquote obj))))",
      "assert": "(macro* assert (tst & msgs) (syntax-quote (if (unquote tst) true (raise! (splice-unquote msgs)))))",
      "false?": "(macro* false? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (unquote x) false))) xs)))))",
      "true?": "(macro* true? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (unquote x) true))) xs)))))",
      "when-not": "(macro* when-not (tst & xs) (syntax-quote (when (not (unquote tst)) (splice-unquote xs))))",
      "unless": "(macro* unless (tst & xs) (syntax-quote (when-not (unquote tst) (splice-unquote xs))))",
      "if-not": "(macro* if-not (tst then else) (syntax-quote (if (not (unquote tst)) (unquote then) (unquote else))))",
      "when": "(macro* when (tst & xs) (syntax-quote (if (unquote tst) (do (splice-unquote xs)))))",
      "cond": "(macro* cond (& xs) (let* [len (count* xs)] (do* (assert* (is-even? len) \"cond expects even args\") (if* (> len 0) (let* [c (nth* xs 0) e (nth* xs 1) r (rest* (rest* xs))] (if* (is-same? c \"else\") (syntax-quote (if true (unquote e))) (syntax-quote (if (unquote c) (unquote e) (cond (splice-unquote r))))))))))",
      "condp": "(macro* condp (pred expr & xs) (let* [Z (gensym*)] (syntax-quote (let [(unquote Z) (unquote expr)] (_kondp_ (unquote pred) (unquote Z) (splice-unquote xs))))))",
      "_kondp_": "(macro* _kondp_ (pred expr & xs) (let* [len (count* xs)] (if* (= len 1) (let* [e (nth* xs 0)] (syntax-quote (if true (unquote e)))) (if* (> len 1) (let* [c (nth* xs 0) e (nth* xs 1) e2 (nth* xs 2) r (rest* (rest* xs)) r2 (rest* (rest* (rest* xs)))] (if* (is-same? e \">>\") (syntax-quote (if-let [____x ((unquote pred) (unquote c) (unquote expr))] ((unquote e2) ____x) (_kondp_ (unquote pred) (unquote expr) (splice-unquote r2)))) (syntax-quote (if ((unquote pred) (unquote c) (unquote expr)) (unquote e) (_kondp_ (unquote pred) (unquote expr) (splice-unquote r))))))))))",
      "->": "(macro* -> (expr form & xs) (let* [x (syntax-quote ((unquote (nth* form 0)) (unquote expr) (splice-unquote (rest* form))))] (if* (> (count* xs) 0) (syntax-quote (-> (unquote x) (splice-unquote xs))) (syntax-quote (unquote x)))))",
      "->>": "(macro* ->> (expr form & xs) (let* [x (syntax-quote ((splice-unquote form) (unquote expr)))] (if* (> (count* xs) 0) (syntax-quote (->> (unquote x) (splice-unquote xs))) (syntax-quote (unquote x)))))",
      "let": "(macro* let (bindings & xs) (let* [sz (count* xs)] (if* (> sz 0) (syntax-quote (with-local-vars [(splice-unquote bindings)] (splice-unquote xs))))))",
      "single?": "(macro* single? (coll) (syntax-quote (= 1 (n# (unquote coll)))))",
      "dual?": "(macro* dual? (coll) (syntax-quote (= 2 (n# (unquote coll)))))",
      "triple?": "(macro* triple? (coll) (syntax-quote (= 3 (n# (unquote coll)))))",
      "loop": "(macro* loop (bindings & more) (let* [es (evens* bindings) os (odds* bindings)] (syntax-quote ((fn [] (with-local-vars [_x_ null recur null _f_ (fn [(splice-unquote es)] (splice-unquote more)) _r_ _f_]) (set! recur (fn [] (set! _x_ arguments) (raw# \"if (_r_) {for(_r_=undefined;_r_===undefined;){_r_=_f_.apply(this,_x_);} return _r_;}\") undefined)) (recur (splice-unquote os))) this))))",
      "concat": "(macro* concat (coll & xs) (syntax-quote (.concat (unquote coll) (splice-unquote xs))))",
      "join": "(macro* join (sep coll) (syntax-quote (.join (unquote coll) (unquote sep))))",
      "do-with": "(macro* do-with (bindings & xs) (let* [sz (count* bindings) _ (assert* (= sz 2) \"expected only 2 in form\") f (nth* bindings 0)] (syntax-quote (let [(unquote f) (unquote (nth* bindings 1))] (splice-unquote xs) (unquote f)))))",
      "do->false": "(macro* do->false (& xs) (syntax-quote (do (splice-unquote xs) false)))",
      "do->true": "(macro* do->true (& xs) (syntax-quote (do (splice-unquote xs) true)))",
      "do->this": "(macro* do->this (& xs) (syntax-quote (do (splice-unquote xs) this)))",
      "do->nil": "(macro* do->nil (& xs) (syntax-quote (do (splice-unquote xs) null)))",
      "do->undef": "(macro* do->undef (& xs) (syntax-quote (do (splice-unquote xs) undefined)))",
      "do->break!": "(macro* do->break! (& xs) (syntax-quote (do (splice-unquote xs) (break-out-of-loop!))))",
      "dotimes": "(macro* dotimes (bindings & xs) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") b1 (first* bindings)] (syntax-quote (floop [:index (unquote b1) :end (unquote (nth* bindings 1))] (splice-unquote xs)))))",
      "range": "(macro* range (a b c) (let* [start (if* b a 0) end (if* b b a) step (if* c c 1)] (syntax-quote (do-with [ret []] (floop [:start (unquote start) :end (unquote end) :step (unquote step) :index i] (ret.push i))))))",
      "apply": "(macro* apply (f this args) (syntax-quote (.apply (unquote f) (unquote this) (unquote args))))",
      "apply+": "(macro* apply+ (f this & args) (syntax-quote (.apply (unquote f) (unquote this) (vec (splice-unquote args)))))",
      "ch@": "(macro* ch@ (s pos) (syntax-quote (.charAt (unquote s) (unquote pos))))",
      "false!": "(macro* false! (x) (syntax-quote (set! (unquote x) false)))",
      "true!": "(macro* true! (x) (syntax-quote (set! (unquote x) true)))",
      "repeat": "(macro* repeat (n x) (syntax-quote (do-with [ret []] (floop [:end (unquote n)] (ret.push (unquote x))))))",
      "if-some+": "(macro* if-some+ (bindings then else) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") tst (gensym*)] (syntax-quote (let [(unquote tst) (unquote (nth* bindings 1)) (unquote (first* bindings)) (unquote tst)] (if (> (n# (unquote tst)) 0) (unquote then) (unquote else))))))",
      "if-some": "(macro* if-some (bindings then else) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") tst (gensym*)] (syntax-quote (let [(unquote tst) (unquote (nth* bindings 1)) (unquote (first* bindings)) (unquote tst)] (if (or (undef? (unquote tst)) (nil? (unquote tst))) (unquote else) (unquote then))))))",
      "if-let": "(macro* if-let (bindings then else) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") tst (gensym*)] (syntax-quote (let [(unquote tst) (unquote (nth* bindings 1)) (unquote (first* bindings)) (unquote tst)] (if (unquote tst) (unquote then) (unquote else))))))",
      "when-some+": "(macro* when-some+ (bindings & xs) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") tst (gensym*)] (syntax-quote (let [(unquote tst) (unquote (nth* bindings 1)) (unquote (first* bindings)) (unquote tst)] (when (> (n# (unquote tst)) 0) (splice-unquote xs))))))",
      "when-some": "(macro* when-some (bindings & xs) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") tst (gensym*)] (syntax-quote (let [(unquote tst) (unquote (nth* bindings 1)) (unquote (first* bindings)) (unquote tst)] (when-not (or (undef? (unquote tst)) (nil? (unquote tst))) (splice-unquote xs))))))",
      "when-let": "(macro* when-let (bindings & xs) (let* [sz (count* bindings) _ (assert* (= 2 sz) \"expected binary form\") tst (gensym*)] (syntax-quote (let [(unquote tst) (unquote (nth* bindings 1)) (unquote (first* bindings)) (unquote tst)] (when (unquote tst) (splice-unquote xs))))))",
      "doto": "(macro* doto (target & xs) (let* [v (gensym*)] (syntax-quote (let [(unquote v) (unquote target)] (splice-unquote (map* (lambda* [e] (syntax-quote ((unquote (first* e)) (unquote v) (splice-unquote (rest* e))))) xs)) (unquote v)))))",
      "map": "(macro* map (f coll) (syntax-quote (.map (or (unquote coll) (vec)) (unquote f))))",
      "every": "(macro* every (f coll) (syntax-quote (.every (or (unquote coll) (vec)) (unquote f))))",
      "find": "(macro* find (p coll) (syntax-quote (.find (or (unquote coll) (vec)) (unquote p))))",
      "filter": "(macro* filter (p coll) (syntax-quote (.filter (or (unquote coll) (vec)) (unquote p))))",
      "some": "(macro* some (p coll) (syntax-quote (.some (or (unquote coll) (vec)) (unquote p))))",
      "take": "(macro* take (cnt coll) (syntax-quote (slice (unquote coll) 0 (unquote cnt))))",
      "constantly": "(macro* constantly (x) (syntax-quote (fn [& xs] (unquote x))))",
      "drop": "(macro* drop (cnt coll) (syntax-quote (slice (unquote coll) (unquote cnt))))",
      "reduce2": "(macro* reduce2 (f coll) (syntax-quote (.reduce (or (unquote coll) (vec)) (unquote f))))",
      "reduce": "(macro* reduce (f start coll) (syntax-quote (.reduce (or (unquote coll) (vec)) (unquote f) (unquote start))))",
      "foldl": "(macro* foldl (f start coll) (syntax-quote (reduce (unquote f) (unquote start) (unquote coll))))",
      "str": "(macro* str (& xs) (syntax-quote (.join (vec (splice-unquote xs)) \"\")))",
      "lambda": "(macro* lambda (code) (let* [sz (count* code) body (if* (> sz 1) code (if* (> sz 0) (nth* code 0)))] (syntax-quote (fn [] (with-local-vars [____args (slice arguments)]) (unquote body)))))",
      "each": "(macro* each (func coll) (syntax-quote (.forEach (unquote coll) (unquote func))))",
      "each-property": "(macro* each-property (func obj) (let* [t (gensym*)] (syntax-quote (let [(unquote t) (unquote obj)] (each (fn [p] ((unquote func) (get (unquote t) p) p)) (properties (unquote t)))))))",
      "each-enumerable": "(macro* each-enumerable (func obj) (let* [t (gensym*)] (syntax-quote (let [(unquote t) (unquote obj)] (each (fn [p] ((unquote func) (get (unquote t) p) p)) (enumerables (unquote t)))))))",
      "each-key": "(macro* each-key (func obj) (let* [t (gensym*) f (gensym*)] (syntax-quote (let [(unquote t) (unquote obj) (unquote f) (unquote func)] (if (kirbystdlibref/object? (unquote t)) (each-enumerable (unquote f) (unquote t)) (each (unquote f) (unquote t)))))))",
      "dosync": "(macro* dosync (& exprs) (syntax-quote (do (splice-unquote exprs))))",
      "monad": "(macro* monad (docstring operations) (syntax-quote (with-local-vars [bind undefined unit undefined zero undefined plus undefined] (let [(splice-unquote operations)] (object :bind bind :unit unit :zero zero :plus plus)))))",
      "defmonad": "(macro* defmonad (name docs operations) (let* [ds (if* (is-str? docs) docs \"\") ps (if* (is-str? docs) operations (if* (is-array? docs) docs)) _ (assert* (is-array? ps) \"no macro operations\")] (syntax-quote (const (unquote name) (monad (unquote ds) (unquote ps))))))",
      "dobind": "(macro* dobind (mbind steps expr) (let* [mv (nth* steps 1) a1 (nth* steps 0) more (rest* (rest* steps))] (syntax-quote ((unquote mbind) (unquote mv) (fn [(unquote a1)] (unquote (if* (not-empty* more) (syntax-quote (dobind (unquote mbind) (unquote more) (unquote expr))) (syntax-quote (do (unquote expr))))))))))",
      "domonad": "(macro* domonad (monad steps body) (syntax-quote ((fn [{:keys [bind unit zero] :as mo}] (with-local-vars [ret (lambda (if (and (kirbystdlibref/nichts? %1) (def? zero)) zero (unit %1)))]) (dobind bind (unquote steps) (ret (unquote body)))) (unquote monad))))",
      "deftest": "(macro* deftest (name & body) (syntax-quote (const (unquote name) (lambda (vec (splice-unquote body))))))",
      "ensure": "(macro* ensure (form msg) (syntax-quote (kirbystdlibref/ensureTest (unquote form) (unquote msg))))",
      "ensureThrown": "(macro* ensureThrown (expected form msg) (syntax-quote (try (unquote form) (kirbystdlibref/ensureTestThrown (unquote expected) null (unquote msg)) (catch e (kirbystdlibref/ensureTestThrown (unquote expected) e (unquote msg))))))",
      "assert*": "(macro* assert* (c msg) (syntax-quote (if* (unquote c) true (throw* (unquote msg)))))",
      "cond*": "(macro* cond* (& xs) (if* (> (count* xs) 0) (list* (quote if*) (first* xs) (nth* xs 1) (cons* (quote cond*) (rest* (rest* xs))))))",
      "_andp_*": "(macro* _andp_* (& xs) (if* (= 1 (unquote (count* xs))) (syntax-quote (unquote (first* xs))) (syntax-quote (and (splice-unquote xs)))))",
      "with-local-vars": "(macro* with-local-vars (bindings & more) (let* [_ (assert* (is-array? bindings) \"expecting array as bindings\") e (count* more) b (count* bindings)] (if* (not* (is-even? b)) (throw* \"wanted even number of binding forms\") (if* (> e 0) (syntax-quote (do (vars (splice-unquote bindings)) (splice-unquote more))) (syntax-quote (vars (splice-unquote bindings)))))))",
      "binding": "(macro* binding (bindings & xs) (syntax-quote ((fn [] (set! (splice-unquote bindings)) (splice-unquote xs)))))"
    }
  },
  MODULE_NAMESPACE: MODULE_NAMESPACE,
  MAX_DASH_INT: MAX_DASH_INT,
  MIN_DASH_INT: MIN_DASH_INT,
  println: println,
  not_DASH_empty: not_DASH_empty,
  stringify: stringify,
  opt_QMRK__QMRK: opt_QMRK__QMRK,
  cons_BANG: cons_BANG,
  conj_BANG: conj_BANG,
  conj: conj,
  disj_BANG: disj_BANG,
  disj: disj,
  pop_BANG: pop_BANG,
  pop: pop,
  wrap_DASH_str: wrap_DASH_str,
  getIndex: getIndex,
  getProp: getProp,
  prn: prn,
  LambdaArg: LambdaArg,
  Primitive: Primitive,
  RegexObj: RegexObj,
  Keyword: Keyword,
  Symbol: Symbol,
  primitive_QMRK: primitive_QMRK,
  primitive: primitive,
  regexObj_QMRK: regexObj_QMRK,
  regexObj: regexObj,
  symbol_QMRK: symbol_QMRK,
  symbol: symbol,
  keyword_QMRK: keyword_QMRK,
  keyword: keyword,
  keyword_DASH__GT_symbol: keyword_DASH__GT_symbol,
  lambdaArg_QMRK: lambdaArg_QMRK,
  lambdaArg: lambdaArg,
  Atom: Atom,
  atom_QMRK: atom_QMRK,
  atom: atom,
  reset_BANG: reset_BANG,
  resetVec_BANG: resetVec_BANG,
  resetMap_BANG: resetMap_BANG,
  resetSet_BANG: resetSet_BANG,
  resetObject_BANG: resetObject_BANG,
  objClass: objClass,
  sort_BANG: sort_BANG,
  deref: deref,
  swap_BANG: swap_BANG,
  typeid: typeid,
  complex_QMRK: complex_QMRK,
  simple_QMRK: simple_QMRK,
  value_QMRK: value_QMRK,
  sequential_QMRK: sequential_QMRK,
  eq_QMRK: eq_QMRK,
  object_QMRK: object_QMRK,
  last: last,
  into_BANG: into_BANG,
  into: into,
  pairs_QMRK: pairs_QMRK,
  list_QMRK: list_QMRK,
  list: list,
  vector_QMRK: vector_QMRK,
  vector: vector,
  set_QMRK: set_QMRK,
  set: set,
  map_QMRK: map_QMRK,
  obj_QMRK: obj_QMRK,
  arraymap: arraymap,
  object: object,
  seq: seq,
  rseq: rseq,
  contains_QMRK: contains_QMRK,
  nichts_QMRK: nichts_QMRK,
  some_QMRK: some_QMRK,
  count: count,
  concat_STAR: concat_STAR,
  evens: evens,
  odds: odds,
  modulo: modulo,
  partition: partition,
  split: split,
  split_DASH_str: split_DASH_str,
  interleave: interleave,
  zipmap: zipmap,
  zipobj: zipobj,
  extendAttr: extendAttr,
  cons: cons,
  gensym: gensym,
  carve: carve,
  assoc_BANG: assoc_BANG,
  dissoc_BANG: dissoc_BANG,
  truthy_QMRK: truthy_QMRK,
  falsy_QMRK: falsy_QMRK,
  flatten: flatten,
  identity: identity,
  m_DASH_identity: m_DASH_identity,
  m_DASH_maybe: m_DASH_maybe,
  m_DASH_list: m_DASH_list,
  m_DASH_state: m_DASH_state,
  m_DASH_continuation: m_DASH_continuation,
  run_DASH_cont: run_DASH_cont,
  quote_DASH_str: quote_DASH_str,
  unquote_DASH_str: unquote_DASH_str,
  escXml: escXml,
  split_DASH_seq: split_DASH_seq,
  select_DASH_keys: select_DASH_keys,
  update_DASH_in_BANG: update_DASH_in_BANG,
  get_DASH_in: get_DASH_in,
  merge: merge,
  mixin: mixin,
  fillArray: fillArray,
  copyArray: copyArray,
  aclone: aclone,
  difference: difference,
  inc: inc,
  dec: dec,
  percent: percent,
  toFixed: toFixed,
  mapcat: mapcat,
  ensureTest: ensureTest,
  ensureTestThrown: ensureTestThrown,
  runtest: runtest,
  pushNSP: pushNSP,
  popNSP: popNSP,
  peekNSP: peekNSP,
  _STAR_ns_STAR: _STAR_ns_STAR,
  minBy: minBy,
  maxBy: maxBy,
  take_DASH_while: take_DASH_while,
  drop_DASH_while: drop_DASH_while,
  split_DASH_with: split_DASH_with
};
