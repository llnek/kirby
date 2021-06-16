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
class SList extends Array{ constructor(...args){ super(...args) } }
//////////////////////////////////////////////////////////////////////////////
class DArray extends Array{
  constructor(...args){
    super(...args);
    this.____list=0;
  }
}
//////////////////////////////////////////////////////////////////////////////
function isSimple(o){return isNichts(o) || isStr(o) || isNum(o) || isBool(o)}
function rtti(v){return Object.prototype.toString.call(v)}
function rttiQ(v,t){return rtti(v)==t}
function isNichts(o){return o===null || o===undefined}
function isEven(n){return n%2===0}
function isOdd(n){return n%2!==0}
function isStr(o){return typeof(o)=="string"}
function isNum(o){return typeof(o)=="number"}
function isBool(o){return typeof(o)=="boolean"}
function isJSSet(x){return rttiQ(x,"[object Set]")}
function isJSMap(x){return rttiQ(x,"[object Map]")}
function isJSObj(x){return rttiQ(x,"[object Object]")}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function copyVec(src){
  let r=new DArray();
  src.forEach(z=>r.push(z));
  return r;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function toVec(...xs){
  let r=new DArray();
  xs.forEach(z=>r.push(z));
  return r;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function toList(...xs){
  let r=new DArray();
  r.____list=1;
  xs.forEach(z=>r.push(z));
  return r;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function copyList(src){
  let r=new DArray();
  r.____list=1;
  src.forEach(z=>r.push(z));
  return r;
}
//////////////////////////////////////////////////////////////////////////////
function ensure(c,...msg){
  if(!c)
    throw Error(msg.join(""));
  return true;
}
//////////////////////////////////////////////////////////////////////////////
/**Write msg to console. */
function println(...msgs){
  if(console) console.log(msgs.join(""));
  return null;
}
//////////////////////////////////////////////////////////////////////////////
/**If coll is empty, returns nil, else coll. */
function not_DASH_empty(coll){
  let k;
  if(coll){
    if(typeof(coll.size)!="undefined") k="size";
    if(typeof(coll.length)!="undefined") k="length"; }
  return k && coll[k]>0 ? coll : null;
}
//////////////////////////////////////////////////////////////////////////////
/**Use a cache to store already referenced objects to prevent circular references. */
function noCRef(){
  return (function(cache){
    return function(k,v){
      if(typeof(v) == "function"){
        v= `${v.name||"native-fn"}`
      }else if(!isSimple(v)){
        if(cache.indexOf(v)<0)
          cache.push(v);
        else
          v=undefined;
      }
      return v;
    }
  })([])
}
//////////////////////////////////////////////////////////////////////////////
/**JSON stringify (no cyclical obj-ref) */
function stringify(obj){
  return obj ? JSON.stringify(obj, noCRef()) : null
}
//////////////////////////////////////////////////////////////////////////////
/** str all */
function str_STAR(...xs){
  return xs.join("")
}
//////////////////////////////////////////////////////////////////////////////
/**If cur is not defined, returns other else cur. */
function opt_QMRK__QMRK(cur, other){
  return typeof(cur) != "undefined" ? cur : other
}
//////////////////////////////////////////////////////////////////////////////
/**Adds one element to the beginning of a collection. */
function cons_BANG(x, coll){
  if(Array.isArray(coll)){
    coll.unshift(x)
  }else{
    throw Error(`Cannot cons! with: ${rtti(coll)}`)
  }
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
/**conj[oin]. Returns coll with the xs 'added'.
 * (conj! nil item) returns (item).
 * If coll is a list, prepends else appends to coll. */
function conj_BANG(coll,...xs){
  if(list_QMRK(coll)){
    xs.forEach(a=>coll.unshift(a))
  }else if(Array.isArray(coll)){
    xs.forEach(a=>coll.push(...xs))
  }else if(coll instanceof Map){
    xs.forEach(a=>{
      ensure(Array.isArray(a)&&
             a.length===2,"bad arg: conj!");
      coll.set(a[0],a[1]);
    })
  }else if(coll instanceof Set){
    xs.forEach(a=>coll.add(a))
  }else{
    throw Error(`Cannot conj! with: ${rtti(coll)}`)
  }
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
/**Like conj! but returns a new collection. */
function conj(coll,...xs){
  let r;
  if(coll===null){
    r=toList()
  }else if(vector_QMRK(coll)){
    r=copyVec(coll)
  }else if(list_QMRK(coll)){
    r=copyList(coll)
  }else if(isJSMap(coll)){
    r=new Map(coll.entries());
  }else if(isJSSet(coll)){
    r=new Set(coll.values());
  }else if(Array.isArray(coll)){
    r=coll.slice();
  }else{
    throw Error(`Cannot conj with: ${typeof(coll)}`)
  }
  return r ? conj_BANG(r,...xs) : null;
}
//////////////////////////////////////////////////////////////////////////////
/**disj[oin]. Returns a set without these keys. */
function disj_BANG(coll,...xs){
  if(!isJSSet(coll))
    throw Error(`Cannot disj! with: ${rtti(coll)}`)
  xs.forEach(a=>coll.delete(a));
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
/**disj[oin]. Returns a new set without these keys. */
function disj(coll,...xs){
  if(!isJSSet(coll))
    throw Error(`Cannot disj with: ${rtti(coll)}`)
  return disj_BANG(new Set(coll.values()),...xs)
}
//////////////////////////////////////////////////////////////////////////////
/**Removes the first element if list,
 * else removes the last element,
 * returning the element and the altered collection. */
function pop_BANG(coll){
  let k;
  if(list_QMRK(coll)) k="shift";
  else if(Array.isArray(coll)) k="pop";
  else throw Error(`Cannot pop! with: ${rtti(coll)}`);
  return k ? toVec(coll[k](),coll) : null;
}
//////////////////////////////////////////////////////////////////////////////
/**Like pop! but returns a new collection. */
function pop(coll){
  let r;
  if(list_QMRK(coll)){
    r=copyList(coll)
  }else if(vector_QMRK(coll)){
    r=copyVec(coll)
  }else if(Array.isArray(coll)){
    r=coll.slice();
  }else{
    throw Error(`Cannot pop with: ${rtti(coll)}`)
  }
  return pop_BANG(r);
}
//////////////////////////////////////////////////////////////////////////////
function getIndex(obj, pos){
  if(!Array.isArray(obj))
    throw Error(`Cannot getIndex with: ${rtti(obj)}`);
  if(pos<0 || pos >= obj.length)
    throw Error(`Index ${pos} out of range: ${obj.length}`);
  return obj[pos];
}
//////////////////////////////////////////////////////////////////////////////
/**If prop is a string, returns the value of this object property,
 * obeying the own? flag, unless if object is a Map, returns value of the key.
 * Otherwise, return the value at the index of the array. */
function getProp(obj, prop, isown){
  let rc=null;
  if(isJSMap(obj)){
    rc=obj.get(prop)
  }else if(Array.isArray(obj)){
    rc=obj[prop]
  }else if(!isSimple(obj) && isStr(prop)){
    if(isown===true &&
       !obj.hasOwnProperty(prop)){}else{ rc=obj[prop] }
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Prepend and append strings to the object. */
function wrap_DASH_str(obj, start, end){
  return [start, obj, end].join("")
}
//////////////////////////////////////////////////////////////////////////////
/**Print data as string - use to dump an AST node. */
function prn(obj,rQ){
  //check for no cyclic reference
  let f=noCRef();
  f(undefined,obj);
  return prn_STAR(obj, rQ, f);
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function prnArr_STAR(obj, rQ, f){
  return obj.map((v,i)=> prn_STAR(f(i,v), rQ)).join(" ")
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function prn_STAR(obj, rQ, func){
  let c3,
      pfx = (a)=> prn_STAR(a, rQ, func),
      parr= (a,b)=> wrap_DASH_str(prnArr_STAR(obj, rQ, func), a,b);
  if(obj instanceof Atom){
    c3 = wrap_DASH_str(pfx(obj.value), "(atom ", ")");
  }else if(obj instanceof SValue){
    c3=obj.value;
  }else if(isJSMap(obj)){
    let x,acc=[];
    obj.forEach((v,k)=>{
      if(!isNichts(v)){
        x = func(k, v);
        v= typeof(x)=="undefined"? "!!!!cyclic reference!!!!": x;
      }
      acc.push(`${pfx(k)} ${pfx(v)}`);
    });
    c3 = wrap_DASH_str(acc.join(" "), "{", "}");
  }else if(isJSSet(obj)){
    let x,acc=[];
    obj.forEach(v=>{
      if(!isNichts(v)){
        x = func(undefined, v);
        v= typeof(x)=="undefined"? "!!!!cyclic reference!!!!": x;
      }
      acc.push(`${pfx(v)}`);
    });
    c3 = wrap_DASH_str(acc.join(" "), "#{", "}");
  }else if(list_QMRK(obj)){
    c3 = parr("(", ")")
  }else if(vector_QMRK(obj)){
    c3= parr("[", "]")
  }else if(isJSObj(obj)){
    let x,v,acc= Object.keys(obj).reduce((acc, k)=>{
      v=obj[k];
      if(!isNichts(v)){
        x = func(k, v);
        v= typeof(x)=="undefined"? "!!!!cyclic reference!!!!": x;
      }
      acc.push(`${pfx(k)} ${pfx(v)}`);
      return acc;
    },[]);
    c3 = wrap_DASH_str(acc.join(" "), "(object ", ")");
  }else if(isStr(obj)){
    c3 = rQ ? quote_DASH_str(obj) : obj;
  }else if(obj===null){
    c3="nil"
  }else if(obj===undefined){
    c3="undefined"
  }else if(obj){
    c3=obj.toString()
  }
  return c3;
}
//////////////////////////////////////////////////////////////////////////////
class SValue /* abstract */{
  constructor(a){
    this.value=a
  }
  toString(){
    return this.value
  }
}
//////////////////////////////////////////////////////////////////////////////
//Defining a keyword
class Keyword extends SValue{
  constructor(name){
    super(name)
  }
  toString(){
    return this.value.startsWith("::") ?
      [_STAR_ns_STAR(), "/", this.value.slice(2)].join("") :
      this.value.startsWith(":") ? this.value.slice(1) : null;
  }
}
//////////////////////////////////////////////////////////////////////////////
//Defining a symbol
class Symbol extends SValue{ constructor(name){ super(name) } }
//////////////////////////////////////////////////////////////////////////////
/**Returns true if a symbol. */
function symbol_QMRK(obj){
  return obj instanceof Symbol
}
//////////////////////////////////////////////////////////////////////////////
/**Create a new Symbol. */
function symbol(name){
  return new Symbol(name)
}
//////////////////////////////////////////////////////////////////////////////
/**Returns true if a keyword. */
function keyword_QMRK(obj){
  return obj instanceof Keyword
}
//////////////////////////////////////////////////////////////////////////////
/**Create a new Keyword. */
function keyword(name){
  return new Keyword(name)
}
//////////////////////////////////////////////////////////////////////////////
/**Convert a Keyword to Symbol. */
function keyword_DASH__GT_symbol(k){
  let s = new Symbol(`${k}`);
  s.source = k.source;
  s.line = k.line;
  s.column = k.column;
  return s;
}
//////////////////////////////////////////////////////////////////////////////
/**Defining a clojure-like Atom. */
class Atom extends SValue{ constructor(val){ super(val) } }
//////////////////////////////////////////////////////////////////////////////
/**Returns true if an Atom. */
function atom_QMRK(a){
  return a instanceof Atom
}
//////////////////////////////////////////////////////////////////////////////
/**Create a new Atom. */
function atom(val){
  return new Atom(val)
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a sorted sequence of the items in coll.
 * If no comparator is supplied, uses compare. */
function sort_BANG(comp, coll){
  let rc=null;
  if(typeof(comp) == "function"){
    if(coll && typeof(coll.sort)!="undefined") rc= coll.sort(comp);
  }else if(comp && typeof(comp.sort)!="undefined") {
    rc= comp.sort()
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Get value inside the Atom. */
function deref(a){
  return a.value
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function a_len(obj){
  return obj && typeof(obj.length)!="undefined" ? obj.length : 0
}
//////////////////////////////////////////////////////////////////////////////
/**Change value inside the Atom, returning the new value. */
function swap_BANG(a, f,...xs){
  let v = f.apply(this, [a.value].concat(xs));
  return (a.value=v);
}
//////////////////////////////////////////////////////////////////////////////
//Defining a Regex pattern
class RegexObj extends SValue{ constructor(v){ super(v) } }
//////////////////////////////////////////////////////////////////////////////
/**Returns the type-id of this object. */
function typeid(obj){
  let s="";
  if(obj instanceof Keyword){
    s="keyword"
  }else if(obj instanceof Symbol){
    s="symbol"
  }else if(obj instanceof DArray && obj.____list===0){
    s="vector"
  }else if(obj instanceof Atom){
    s="atom"
  }else if(obj instanceof DArray && obj.____list===1){
    s="list"
  }else if(obj instanceof Map){
    s="map"
  }else if(obj instanceof Set){
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
  }else if(!isSimple(obj)&&isJSObj(obj)){
    s="object"
  }else if(Array.isArray(obj)){
    s="js-vec"
  }else{
    throw new Error(`Unknown type [${rtti(obj)}]`);
  }
  return s;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function isComplex(x){
  return !isSimple(x)
}
////////////////////////////////////////////////////////////////////////////////
/** @private */
function isValue(obj){
  return obj === null ||
         vector_QMRK(obj) ||
         list_QMRK(obj) ||
         isJSMap(obj) ||
         isJSSet(obj) ||
         typeof(obj) == "boolean" ||
         typeof(obj) == "string" ||
         typeof(obj) == "number" ||
         // js data
         object_QMRK(obj) || Array.isArray(obj)
}
//////////////////////////////////////////////////////////////////////////////
/**True if coll implements Sequential. */
function sequential_QMRK(arr){
  return vector_QMRK(arr) || list_QMRK(arr) || typeof(arr)=="string" || Array.isArray(arr)
}
//////////////////////////////////////////////////////////////////////////////
/**true if both are equal. */
function eq_QMRK(a,b){
  let ok=false;
  if(isJSMap(a) && isJSMap(b)){
    if(a.size===b.size){
      ok=true;
      a.forEach((v, k)=>{ if(!eq_QMRK(b.get(k), v)) ok=false }) }
  }else if(isJSSet(a) && isJSSet(b)){
    if(a.size===b.size){
      ok=true;
      a.forEach((v, k)=>{ if(!b.has(v)) ok=false }) }
  }else if(isJSObj(a) && isJSObj(b)){
    let ksa=Object.keys(a),
        ksb=Object.keys(b);
    if(eq_QMRK(ksa,ksb)){
      ok=true;
      for(k in ksa)
        if(!eq_QMRK(get(a,k),get(b,k))){ ok=false; break; } }
  }else if(Array.isArray(a) && Array.isArray(b)){
    if(a.length===b.length){
      ok=true;
      for(let i=0;i<a.length; ++i){
        if(!eq_QMRK(a[i],b[i])){ ok=false; break; } } }
  }else if(symbol_QMRK(a) && symbol_QMRK(b)){
    ok= a.value == b.value
  }else if(keyword_QMRK(a) && keyword_QMRK(b)){
    ok= a.toString() == b.toString()
  }else if(typeof(a)=="string" && typeof(b)=="string"){
    ok= a==b;
  }else if(typeof(a)=="number" && typeof(b) == "number"){
    ok= a==b
  }else if(typeof(a)=="boolean" && typeof(b) == "boolean"){
    ok= a==b
  }else if (a===null && b===null){
    ok=true
  }else if(a===undefined && b===undefined){
    ok=true
  }
  return ok;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns true if a js object. */
function object_QMRK(obj){
  return !isSimple(obj) &&
         !Array.isArray(obj) &&
         !isJSMap(obj) && !isJSSet(obj) && isJSObj(obj)
}
//////////////////////////////////////////////////////////////////////////////
/**Returns the last element. */
function last(coll){
  return sequential_QMRK(coll) && coll.length>0 ? coll[coll.length-1] : null
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a new coll consisting of to-coll with all of the items of from-coll conjoined. */
function into(to, coll){
  if(list_QMRK(to)){
    if(vector_QMRK(coll)||list_QMRK(coll) || Array.isArray(coll))
      coll.forEach(z=>to.push(z));
  }else if(vector_QMRK(to)){
    if(vector_QMRK(coll)||list_QMRK(coll) || Array.isArray(coll))
      coll.forEach(z=>to.push(z));
  }else{
    throw Error(`Cannot into with: ${rtti(to)} to ${rtti(coll)}`)
  }
  return to;
}
////////////////////////////////////////////////////////////////////////////////
/**Returns true if a List. */
function list_QMRK(obj){
  return obj instanceof DArray && obj.____list===1
}
////////////////////////////////////////////////////////////////////////////////
/**Create a List. */
function list(...xs){
  return toList(...xs)
}
//////////////////////////////////////////////////////////////////////////////
/**Returns true if a Vector. */
function vector_QMRK(obj){
  return obj instanceof DArray && obj.____list===0
}
//////////////////////////////////////////////////////////////////////////////
/**Create a Vector. */
function vector(...xs){
  return toVec(...xs)
}
//////////////////////////////////////////////////////////////////////////////
/**Returns true if a Set. */
function set_QMRK(obj){
  return rttiQ(obj,"[object Set]")
}
//////////////////////////////////////////////////////////////////////////////
/**Create a Set. */
function hash_DASH_set(...xs){
  return new Set(xs)
}
//////////////////////////////////////////////////////////////////////////////
function hash_DASH_map(...xs){
  ensure(isEven(xs.length),"Arity Error: even n# expected.");
  let out=new Map();
  for(let i=0;i<xs.length;i+=2){
    out.set(xs[i],xs[i+1])
  }
  return out;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns true if a Hashmap. */
function map_QMRK(obj){
  return rttiQ(obj,"[object Map]")
}
//////////////////////////////////////////////////////////////////////////////
//Create a new js object
function object(...xs){
  if(isOdd(xs.length))
    throw new Error("Invalid arity for: object");
  return zipobj(evens(xs), odds(xs));
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a sequence. */
function seq(obj){
  let rc=toList();
  if(typeof(obj)=="string"){
    obj.split("").forEach(c=>rc.push(c));
  }else if(isJSMap(obj)){
    obj.forEach((v,k)=>rc.push(toVec(k,v)));
  }else if(isJSSet(obj)){
    obj.forEach(v=>rc.push(v));
  }else if(list_QMRK(obj)||vector_QMRK(obj)||Array.isArray(obj)){
    obj.forEach(a=>rc.push(a));
  }else if(isJSObj(obj)){
    Object.keys(obj).forEach(k=>{
      rc.push(toVec(k,obj[k]))
    });
  }else{
    throw Error(`Cannot seq with: ${rtti(obj)}`)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a seq of the items in coll in reverse order.
 * If rev is empty returns nil. */
function rseq(obj){
  let rc=toList();
  if(typeof(obj)=="string"){
    obj.split("").forEach(c=>rc.unshift(c));
  }else if(isJSMap(obj)){
    obj.forEach((v,k)=>rc.unshift(toVec(k,v)));
  }else if(isJSSet(obj)){
    obj.values().forEach(v=>rc.unshift(v));
  }else if(list_QMRK(obj)||vector_QMRK(obj)||Array.isArray(obj)){
    obj.forEach(a=>rc.unshift(a));
  }else{
    throw Error(`Cannot rseq with: ${rtti(obj)}`)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**true if item is inside. */
function contains_QMRK(coll, x){
  let rc=null;
  if(isJSMap(coll)||isJSSet(coll)){
    rc=coll.has(x)
  }else if(Array.isArray(coll)||isStr(coll)){
    rc=coll.includes(x)
  }else{
    throw Error(`Cannot contains? with: ${rtti(coll)}`)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**true if object is either null of undefined. */
function nichts_QMRK(obj){
  return typeof(obj) === "undefined" || obj === null
}
////////////////////////////////////////////////////////////////////////////////
/**true if object is defined and not null. */
function some_QMRK(obj){
   return !(typeof(obj) === "undefined" || obj === null)
}
//////////////////////////////////////////////////////////////////////////////
/**Count the number of elements inside. */
function count(coll){
  let rc;
  if(isJSMap(coll)||isJSSet(coll)){
    rc=coll.size
  }else if(list_QMRK(coll)||vector_QMRK(coll)||Array.isArray(coll)||isStr(coll)){
    rc=coll.length
  }else if(coll){
    throw Error(`Cannot count with: ${rtti(coll)}`)
  }else{
    rc=0
  }
  return rc;
}
////////////////////////////////////////////////////////////////////////////////
/**Add many to this collection. */
function concat(coll,...xs){
  let rc;
  if(Array.isArray(coll)){
    rc=copyList(coll)
    xs.forEach(a=>{
      ensure(Array.isArray(a),"bad arg to concat");
      a.forEach(z=>rc.push(z))
    });
  }else{
    throw Error(`Cannot concat with: ${rtti(coll)}`)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function repeat_DASH_every(coll, start, step){
  let rc;
  if(Array.isArray(coll)){
    rc=toList();
    for(let i=start,end=coll.length; i<end; i += step){
      rc.push(coll[i])
    }
  }else{
    throw Error(`Cannot repeat-every with: ${rtti(coll)}`)
  }
  return rc;
}
////////////////////////////////////////////////////////////////////////////////
/**Collect every 2nd item starting at 0. */
function evens(coll){
  return repeat_DASH_every(coll, 0, 2)
}
//////////////////////////////////////////////////////////////////////////////
/**Collect every 2nd item starting at 1. */
function odds(coll){
  return repeat_DASH_every(coll, 1, 2)
}
//////////////////////////////////////////////////////////////////////////////
/**Modulo. */
function mod(x, N){
  return x<0 ? (x - (-1 * (N + (Math.floor(((-1 * x) / N)) * N)))) : (x % N)
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a sequence of lists of n items each. */
function partition(n, coll){
  let recur = null;
  let _x_ = null;
  function _f_(ret, [x,y]){
    if(not_DASH_empty(x)){ ret.push(x) }
    return 0 === count(y) ? ret : recur(ret, split_DASH_seq(y, n))
  }
  let _r_ = _f_;
  recur=function(){
    _x_=arguments;
    if(_r_){
      for(_r_ = undefined; _r_ === undefined;){
        _r_= _f_.apply(this,_x_)
      }
      return _r_;
    }
  };
  if(Array.isArray(coll)){
    return recur(toList(), split_DASH_seq(coll, n))
  }else if (!coll){
    return toList()
  }else{
    throw Error(`Cannot partition with: ${rtti(coll)}`)
  }
}
//////////////////////////////////////////////////////////////////////////////
/**Splits string on a sep or regular expression.  Optional argument limit is
 * the maximum number of splits. Returns vector of the splits. */
function split(s, re,limit){
  if(!isStr(s))
    throw Error(`Cannot split with: ${rtti(s)}`);
  let out=toList(),
      rc= typeof(limit) != "undefined" ? s.split(re, limit) : s.split(re)
  rc.forEach(c=>out.push(c));
  return out;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a sequence of strings of n characters each. */
function split_DASH_str(n, s){
  if(!isStr(s))
    throw Error(`Cannot split-str with: ${rtti(s)}`);
  let rc = toList();
  for(let i=0; i<s.length; i += n){
    rc.push(s.substr(i, n))
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a seq of the first item in each coll, then the second, etc. */
function interleave(c1, c2){
  if(!sequential_QMRK(c1))
    throw Error(`Cannot interleave with: ${typeof(c1)}`);
  if(!sequential_QMRK(c2))
    throw Error(`Cannot interleave with: ${typeof(c2)}`);
  let cz = c2.length < c1.length ? c2.length : c1.length;
  let rc = toList();
  for(let i=0,end=cz; i<end; ++i){
    rc.push(c1[i], c2[i])
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns an object with the keys mapped to the corresponding vals. */
function zipmap(keys, vals){
  if(!sequential_QMRK(keys))
    throw Error(`Cannot interleave with: ${rtti(keys)}`);
  if(!sequential_QMRK(vals))
    throw Error(`Cannot interleave with: ${rtti(vals)}`);
  let cz=keys.length < vals.length ? keys.length : vals.length;
  let rc = new Map();
  for(let i=0,end=cz; i<end; ++i){
    rc.set(keys[i], vals[i])
  }
  return rc;
}
////////////////////////////////////////////////////////////////////////////////
/**Returns an object with the keys mapped to the corresponding vals. */
function zipobj(keys, vals){
  if(!sequential_QMRK(keys))
    throw Error(`Cannot interleave with: ${rtti(keys)}`);
  if(!sequential_QMRK(vals))
    throw Error(`Cannot interleave with: ${rtti(vals)}`);
  let cz=keys.length<vals.length ? keys.length : vals.length;
  let rc = {};
  for(let i=0,end=cz; i<end; i+=1){
    rc[`${keys[i]}`]= vals[i]
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function extend_DASH_attr(obj, attr,flags){
  if(rttiQ(obj,"[object Object]")){
    flags=opt_QMRK__QMRK(flags, {"enumerable": false, "writable": true});
    Object.defineProperty(obj, attr, flags);
  }
  return obj;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a new seq where x is the first element and seq is the rest. */
function cons(x, coll){
  if(!sequential_QMRK(coll))
    throw Error(`Cannot cons with: ${rtti(coll)}`);
  let rc=toList(x);
  coll.forEach(a=>rc.push(a));
  return rc;
}
let GENSYM_COUNTER = 0;
//////////////////////////////////////////////////////////////////////////////
/**Generates next random symbol. */
function gensym(pfx){
  let x= ++GENSYM_COUNTER;
  return symbol(`${opt_QMRK__QMRK(pfx, "GS__")}x`);
}
//////////////////////////////////////////////////////////////////////////////
function carve(coll,start,end){
  if(!sequential_QMRK(coll))
    throw Error(`Cannot carve with: ${rtti(coll)}`);
  if(typeof(end) == "undefined"){
    end=coll.length
  }else if(typeof(start) == "undefined"){
    start=0
  }
  let rc=toList();
  for(let i=start;i<end;++i) rc.push(coll[i]);
  return rc;
}
////////////////////////////////////////////////////////////////////////////////
function assoc_BANG(obj,...xs){
  if(!isJSMap(obj))
    throw Error(`Cannot assoc! with: ${rtti(obj)}`);
  if(isOdd(xs.length))
    ensure(false,"expected even n# of args");
  for(let k,v,i=0; i<xs.length; i += 2){
    obj.set(xs[i], xs[i+1]);
  }
  return obj;
}
//////////////////////////////////////////////////////////////////////////////
function dissoc_BANG(obj,...xs){
  if(!isJSMap(obj))
    throw Error(`Cannot dissoc! with: ${rtti(obj)}`);
  xs.forEach(k=>obj.delete(k));
  return obj;
}
//////////////////////////////////////////////////////////////////////////////
/**LISP truthy. */
function truthy_QMRK(a){
  return !falsy_QMRK(a)
}
//////////////////////////////////////////////////////////////////////////////
/**LISP falsy. */
function falsy_QMRK(a){
  return a === null || a === false
}
//////////////////////////////////////////////////////////////////////////////
/**Flatten an array. */
function flatten(xs){
  let rc= null;
  if(!isStr(xs) && sequential_QMRK(xs)){
    rc=xs.reduce((acc, v)=>{
      if(isStr(v)|| !sequential_QMRK(v))
        acc.push(v);
      else
        flatten(v).forEach(a=>acc.push(a));
      return acc;
    }, toList());
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns its argument. */
function identity(x){
  return x
}
//////////////////////////////////////////////////////////////////////////////
const monad_DASH_identity = {
  zero: undefined,
  plus: undefined,
  unit: function(a) { return a },
  bind: function(mv, mf) { return mf(mv) }
};
//////////////////////////////////////////////////////////////////////////////
const monad_DASH_maybe = {
  zero: undefined,
  plus: undefined,
  unit: function(a) { return a },
  bind: function(mv, mf) { return mv ? mf(mv) : null }
};
//////////////////////////////////////////////////////////////////////////////
const monad_DASH_list = {
  bind: function(mv, mf) { return flatten((mv || []).map(mf)) },
  unit: function(a) { return vector(a) },
  zero: vector(),
  plus: function(...xs) { return flatten(xs) }
};
//////////////////////////////////////////////////////////////////////////////
const monad_DASH_state = {
  zero: undefined,
  plus: undefined,
  bind: function(mv, mf) {
    return function(state) {
      let [value,newState] = mv(state);
      return mf(value)(newState);
    }
  },
  unit: function(v) { return function(a) { vector(v, a) } }
};
//////////////////////////////////////////////////////////////////////////////
const monad_DASH_continuation = {
  zero: undefined,
  plus: undefined,
  bind: function(mv, mf) {
    return function(c){
      return mv(function(v){ return mf(v)(c) })
    }
  },
  unit: function(v){ return function(c){ return c(v) } }
};
////////////////////////////////////////////////////////////////////////////////
/** Execute the computation cont in the cont monad and return its result. */
function monad_DASH_run_DASH_cont(c){
  return c(identity)
}
//////////////////////////////////////////////////////////////////////////////
/**Add quotes around a string. */
function quote_DASH_str(s){
  let ch,out = "\"";
  if(s)
  for(let i=0; i<s.length; ++i){
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
/**Removes quotes around a string. */
function unquote_DASH_str(s){
  if(isStr(s) && s.startsWith("\"") && s.endsWith("\"")){
    let out=""
    s= s.slice(1, -1);
    for(let nx,ch,i=0;i<s.length;++i){
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
/**Escape XML special chars. */
function esc_DASH_xml(s){
  let out = "";
  if(s)
  for(let c,i=0; i<s.length; ++i){
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
/**Split a collection into 2 parts. */
function split_DASH_seq(coll, cnt){
  let out;
  if(isStr(coll)){
    if(cnt < coll.length){
      out=toList(coll.slice(0, cnt), coll.slice(cnt))
    }else{
      out=toList(coll.slice(0),"")
    }
  }else if(sequential_QMRK(coll)){
    if(cnt < coll.length){
      out=toList(copyList(coll.slice(0, cnt)),
                 copyList(coll.slice(cnt)))
    }else{
      out=toList(copyList(coll),toList())
    }
  }else{
    throw Error(`Cannot split-seq with: ${rtti(coll)}`)
  }
  return out;
}
////////////////////////////////////////////////////////////////////////////////
/**Get a subset of keys. */
function select_DASH_keys(coll, keys){
  if(!isJSMap(coll))
    throw Error(`Cannot select-keys with: ${rtti(coll)}`);
  if(isStr(keys)||!sequential_QMRK(keys))
    throw Error(`Cannot select-keys with: ${rtti(keys)}`);
  return keys.reduce((acc, n)=>{
    if(coll.has(n))
      acc.set(n,coll.get(n));
    return acc;
  },new Map());
}
////////////////////////////////////////////////////////////////////////////////
/** @private */
function doUpdateIn(coll, n, func, args, err){
  let v,cur;
  if(isNum(n)){
    cur= !isStr(coll)&&sequential_QMRK(coll) && n< count(coll) ? coll[n] : err(n)
  }else if(map_QMRK(coll)){
    if(coll.has(n))cur= coll.get(n)
  }else if(isJSObj(coll)){
    if(Object.hasOwnProperty(coll,n)) cur=coll[n]
  }
  cur=func(cur, ...args);
  if(isJSMap(coll))
    coll.set(n,cur);
  else
    coll[n]=cur;
  return coll;
}
//////////////////////////////////////////////////////////////////////////////
/**'Updates' a value in a nested associative structure, where ks is a
 * sequence of keys and f is a function that will take the old value
 * and any supplied args and return the new value, and returns a new
 * nested structure.  If any levels do not exist, hash-maps will be created. */
function update_DASH_in_BANG(coll, keys, func,...xs){
  function err(a){
    throw new Error(`update-in! failed, bad nested keys: ${a}`) }
  let m,root = coll;
  let end= keys.length-1;
  for(let n,i=0,end=keys.length; i<=end; i += 1){
    n = keys[i];
    if(i === end){
      doUpdateIn(root, n, func, xs, err)
    }else if(isNum(n)){
      if(!(!isStr(root)&&sequential_QMRK(root) && n<root.length)){
        err(n)
      }else{
        root = root[n]
      }
    }else if(isJSMap(root)){
      m = root.get(n);
      if(!root.has(n)){
        root.set(n,m=new Map())
      }
      if(!isJSMap(m)){
        err(n)
      }
      root = m
    }
  }
  return coll;
}
////////////////////////////////////////////////////////////////////////////////
/**Returns the value in a nested associative structure,
 * where ks is a sequence of keys. Returns nil if the key
 * is not present, or the not-found value if supplied. */
function get_DASH_in(coll, keys){
  let root = coll;
  let ret = null;
  let end = keys.length-1;
  for(let n,i=0; i <= end; i += 1){
    n= keys[i];
    if(isNum(n)){
      if(!(!isStr(root)&&sequential_QMRK(root) && n < root.length)){
        ret = null;
        break;
      }
      ret= root = root[n];
    }else if(isJSMap(root)){
      if(!root.has(n)){ret=root=null}else {
        ret= root = root.get(n);
      }
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Merge maps
function merge_BANG(base, m){
  let ret= base || new Map();
  let src= m || new Map();
  ensure(isJSMap(ret)||isJSObj(ret),"bad arg to merge!");
  ensure(isJSMap(src)||isJSObj(src),"bad arg to merge!");
  function loop(v, k){
    isJSMap(ret)?ret.set(k, v):(ret[k]=v) }
  if(isJSObj(src)){
    Object.keys(src).forEach(p=> loop(src[p], p))
  }else{
    src.forEach(loop)
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Merge objects
function mix_BANG(base, m){
  let ret = base || {};
  let src = m || {};
  ensure(isJSMap(ret)||isJSObj(ret),"bad arg to mix!");
  ensure(isJSMap(src)||isJSObj(src),"bad arg to mix!");
  function loop(v, k){
    isJSMap(ret)?ret.set(k, v):(ret[k]=v) }
  if(isJSObj(src)){
    Object.keys(src).forEach(p=> loop(src[p], p))
  }else{
    src.forEach(loop)
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a map that consists of the rest of the maps conj-ed onto
 * the first.  If a key occurs in more than one map, the mapping from
 * the latter (left-to-right) will be the mapping in the result. */
function merge(...xs){
  return xs.reduce((acc, o)=> merge_BANG(acc, o) , new Map())
}
////////////////////////////////////////////////////////////////////////////////
/**Returns an object that consists of the rest of the objects conj-ed onto
 * the first.  If a property occurs in more than one object, the mapping
 * from the latter (left-to-right) will be the mapping in the result. */
function mixin(...objs){
  return objs.reduce((acc, o)=> mix_BANG(acc, o) , {})
}
////////////////////////////////////////////////////////////////////////////////
/**Creates a clone of the given JavaScript array.
 * The result is a new array, which is a shallow copy. */
function aclone(src){
  return Array.isArray(src) ? src.slice(0) : null
}
//////////////////////////////////////////////////////////////////////////////
/**Return a set that is the first set without elements of the other set. */
function difference(a, b){
  if(!isJSSet(a))
    throw Error(`Cannot difference with: ${rtti(a)}`);
  if(!isJSSet(b) && b !== null)
    throw Error(`Cannot difference with: ${rtti(b)}`);
  let ret = new Set();
  if(b===null){
    ret=new Set(a.values())
  }else{
    a.forEach(v=>{
      if(!b.has(v)) ret.add(v)
    });
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a number one greater than x. */
function inc(x){
  return x+1
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a number one lesser than x. */
function dec(x){
  return x-1
}
//////////////////////////////////////////////////////////////////////////////
function percent(numerator, denominator){
  return 100 * (numerator / denominator)
}
//////////////////////////////////////////////////////////////////////////////
function to_DASH_fixed(num, digits=2){
  return Number(num).toFixed(digits)
}
//////////////////////////////////////////////////////////////////////////////
function mapcat(func, ...colls){
  let args=[],
      z=Infinity,
      out=toList();
  colls.forEach(c=>{
    if(isStr(c) || !sequential_QMRK(c))
      throw Error(`Cannot mapcat with: ${rtti(c)}`);
    z=min(z,c.length);
  });
  for(let r,i=0;i<z;++i){
    args.length=0;
    colls.forEach(c=> args.push(c[i]))
    r=func(...args);
    if(Array.isArray(r)) r.forEach(w=>out.push(w));
    else out.push(r);
  }
  return out;
}
//////////////////////////////////////////////////////////////////////////////
function ensure_DASH_test(cnd, msg){
  msg = msg || "test";
  try{
    return `${cnd ? "passed:" : "FAILED:"} ${msg}`
  }catch(e){
    return `FAILED: ${msg}`
  }
}
//////////////////////////////////////////////////////////////////////////////
function ensure_DASH_test_DASH_thrown(expected, error, msg){
  return error === null ?
    `FAILED: ${msg}` :
    (expected == typeof(error) || expected == "any") ? `passed: ${msg}` : `FAILED: ${msg}`
}
//////////////////////////////////////////////////////////////////////////////
function run_DASH_test(test,title){
  let now = new Date(),
      results = test(),
      sum = results.length,
      ok = results.filter(a=> a.startsWith("p")).length,
      ps = toFixed(percent(ok, sum));
  title = title || "test";
  return ["+".repeat(78), title, now,
          "+".repeat(78), results.join("\n"),
          "=".repeat(78),
          `Passed: ${ok}/${sum} [${ps}%]`,
          `Failed: ${sum - ok}`,
          `CPU Time: ${new Date() - now}ms`].join("\n")
}
//////////////////////////////////////////////////////////////////////////////
const _STAR_ns_DASH_cache_STAR = atom([
  new Map([["id", "user"],
           ["meta", null]])
]);
//////////////////////////////////////////////////////////////////////////////
function push_DASH_nsp(nsp,info){
  let obj=new Map([["id", nsp], ["meta", info]]);
  return swap_BANG(_STAR_ns_DASH_cache_STAR, function(a){
    a.unshift(obj);
    return a;
  })
}
//////////////////////////////////////////////////////////////////////////////
function pop_DASH_nsp(){
  return swap_BANG(_STAR_ns_DASH_cache_STAR, function(a){
    a.shift();
    return a;
  })
}
//////////////////////////////////////////////////////////////////////////////
function peek_DASH_nsp(){
  return _STAR_ns_DASH_cache_STAR.value[0]
}
//////////////////////////////////////////////////////////////////////////////
function _STAR_ns_STAR(){
  let n = peek_DASH_nsp();
  return typeof(n) == "undefined" ||
         n === null ? null : getProp(n, "id")
}
//////////////////////////////////////////////////////////////////////////////
function min_DASH_by(func, coll){
  let z=null;
  if(not_DASH_empty(coll)){
    z=coll[0];
    for(let i=1;i<coll.length;++i){
      if(func(z)<func(coll[i])){z=z}else{z=coll[i]} }
  }
  return z;
}
//////////////////////////////////////////////////////////////////////////////
function max_DASH_by(func, coll){
  let z=null;
  if(not_DASH_empty(coll)){
    z=coll[0];
    for(let i=1;i<coll.length;++i){
      if(func(z)>func(coll[i])){z=z}else{z=coll[i]} }
  }
  return z;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a sequence of successive items from coll while
 * (pred item) returns logical true. pred must be free of side-effects. */
function take_DASH_while(pred,coll){
  let ret=null;
  for(let c,i=0; i<coll.length; ++i){
    if(!ret)
      ret=toList();
    c = coll[i];
    if(pred(c)){ ret.push(c) }else{break}
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a sequence of the items in coll starting from the
 * first item for which (pred item) returns logical false. */
function drop_DASH_while(pred, coll){
  let ret = null;
  for(let c,i=0; i<coll.length; ++i){
    c = coll[i];
    if(!pred(c)){
      ret=copyList(coll.slice(i));
      break;
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a list of [(take-while pred coll) (drop-while pred coll)] */
function split_DASH_with(pred, coll){
  return toList(take_DASH_while(pred, coll), drop_DASH_while(pred, coll))
}
//////////////////////////////////////////////////////////////////////////////
function primitive_QMRK(p){
  return isSimple(p)
}
//////////////////////////////////////////////////////////////////////////////
function pairs_QMRK(p){
  return Array.isArray(p)
}
//////////////////////////////////////////////////////////////////////////////
/**Set a new value to the Atom. */
function reset_BANG(a, v){
  a.value=v;
  return null;
}
//////////////////////////////////////////////////////////////////////////////
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.stdlib",
    vars: ["MODULE_NAMESPACE", "MAX-INT", "MIN-INT",
           "monad-continuation","monad-state", "monad-list","monad-maybe","monad-identity",
           "rtti","println", "not-empty", "stringify", "str*", "opt??", "cons!", "conj!", "conj", "disj!", "disj", "pop!", "pop", "wrap-str", "getIndex", "getProp", "prn", "RegexObj", "Keyword", "Symbol", "DArray","primitive?", "symbol?", "symbol", "keyword?", "keyword", "keyword->symbol", "SList", "SValue", "Atom", "atom?", "atom", "reset!", "sort!", "deref", "swap!", "typeid", "complex?", "simple?", "value?", "sequential?", "eq?", "hash-map","hash-set","object?", "last", "into!", "into", "pairs?", "list?", "list", "vector?", "vector", "set?", "map?", "object", "seq", "rseq", "contains?", "nichts?", "some?", "count", "concat*", "evens", "odds", "mod", "partition", "split", "split-str", "interleave", "zipmap", "zipobj", "extend-attr", "cons", "gensym", "carve", "assoc!", "dissoc!", "truthy?", "falsy?", "flatten", "identity", "quote-str", "unquote-str", "esc-xml", "split-seq", "select-keys", "update-in!", "get-in", "merge", "mixin", "aclone", "difference", "inc", "dec", "percent", "to-fixed", "mapcat", "ensure-test", "ensure_DASH_test_DASH_thrown", "run-test", "push_DASH_nsp", "pop_DASH_nsp", "peek_DASH_nsp", "*ns*", "min-by", "max-by", "take-while", "drop-while", "split-with"],
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
      "trap!": "(macro* trap! (& msgs) (let* [sz (count* msgs)] (if* (> sz 1) (syntax-quote (throw (join \"\" (vector (splice-unquote msgs))))) (if* (> sz 0) (syntax-quote (throw (unquote (nth* msgs 0)))) (syntax-quote (throw \"error!\"))))))",
      "merror": "(macro* merror (e) (syntax-quote (new Error (unquote e))))",
      "raise!": "(macro* raise! (& msgs) (let* [sz (count* msgs)] (if* (> sz 1) (syntax-quote (throw (merror (join \"\" (vector (splice-unquote msgs)))))) (if* (> sz 0) (syntax-quote (throw (merror (unquote (nth* msgs 0))))) (syntax-quote (throw (merror \"error!\")))))))",
      "slice": "(macro* slice (arr start end) (if* end (syntax-quote (Array.prototype.slice.call (unquote arr) (unquote start) (unquote end))) (if* start (syntax-quote (Array.prototype.slice.call (unquote arr) (unquote start))) (syntax-quote (Array.prototype.slice.call (unquote arr))))))",
      "num-str": "(macro* num-str (n) (syntax-quote (.toString (Number (unquote n)))))",
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
      "even?": "(macro* even? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= 0 (kirbystdlibref/mod (unquote x) 2)))) xs)))))",
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
      "object-map?": "(macro* object-map? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (whatis? (unquote x)) \"[object Map]\"))) xs)))))",
      "object-set?": "(macro* object-set? (& xs) (syntax-quote (_andp_* (splice-unquote (map* (lambda* [x] (syntax-quote (= (whatis? (unquote x)) \"[object Set]\"))) xs)))))",
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
      "apply+": "(macro* apply+ (f this & args) (syntax-quote (.apply (unquote f) (unquote this) (vector (splice-unquote args)))))",
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
      "map": "(macro* map (f coll) (syntax-quote (.map (or (unquote coll) (vector)) (unquote f))))",
      "every": "(macro* every (f coll) (syntax-quote (.every (or (unquote coll) (vector)) (unquote f))))",
      "find": "(macro* find (p coll) (syntax-quote (.find (or (unquote coll) (vector)) (unquote p))))",
      "filter": "(macro* filter (p coll) (syntax-quote (.filter (or (unquote coll) (vector)) (unquote p))))",
      "some": "(macro* some (p coll) (syntax-quote (.some (or (unquote coll) (vector)) (unquote p))))",
      "take": "(macro* take (cnt coll) (syntax-quote (slice (unquote coll) 0 (unquote cnt))))",
      "constantly": "(macro* constantly (x) (syntax-quote (fn [& xs] (unquote x))))",
      "drop": "(macro* drop (cnt coll) (syntax-quote (slice (unquote coll) (unquote cnt))))",
      "reduce2": "(macro* reduce2 (f coll) (syntax-quote (.reduce (or (unquote coll) (vector)) (unquote f))))",
      "reduce": "(macro* reduce (f start coll) (syntax-quote (.reduce (or (unquote coll) (vector)) (unquote f) (unquote start))))",
      "foldl": "(macro* foldl (f start coll) (syntax-quote (reduce (unquote f) (unquote start) (unquote coll))))",
      "str": "(macro* str (& xs) (syntax-quote (str* (splice-unquote xs))))",
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
      "deftest": "(macro* deftest (name & body) (syntax-quote (const (unquote name) (lambda (vector (splice-unquote body))))))",
      "ensure": "(macro* ensure (form msg) (syntax-quote (kirbystdlibref/ensure_DASH_test (unquote form) (unquote msg))))",
      "ensure-thrown": "(macro* ensure-thrown (expected form msg) (syntax-quote (try (unquote form) (kirbystdlibref/ensure_DASH_test_DASH_thrown (unquote expected) null (unquote msg)) (catch e (kirbystdlibref/ensure_DASH_test_DASH_thrown (unquote expected) e (unquote msg))))))",
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
  RegexObj: RegexObj,
  Keyword: Keyword,
  Symbol: Symbol,
  DArray: DArray,
  primitive_QMRK: primitive_QMRK,
  symbol_QMRK: symbol_QMRK,
  symbol: symbol,
  keyword_QMRK: keyword_QMRK,
  keyword: keyword,
  keyword_DASH__GT_symbol: keyword_DASH__GT_symbol,
  SList:SList,
  SValue:SValue,
  Atom: Atom,
  atom_QMRK: atom_QMRK,
  atom: atom,
  reset_BANG: reset_BANG,
  sort_BANG: sort_BANG,
  deref: deref,
  swap_BANG: swap_BANG,
  typeid: typeid,
  sequential_QMRK: sequential_QMRK,
  eq_QMRK: eq_QMRK,
  object_QMRK: object_QMRK,
  last: last,
  into: into,
  pairs_QMRK: pairs_QMRK,
  list_QMRK: list_QMRK,
  list: list,
  vector_QMRK: vector_QMRK,
  vector: vector,
  set_QMRK: set_QMRK,
  map_QMRK: map_QMRK,
  object: object,
  seq: seq,
  rseq: rseq,
  contains_QMRK: contains_QMRK,
  nichts_QMRK: nichts_QMRK,
  some_QMRK: some_QMRK,
  count: count,
  concat: concat,
  evens: evens,
  odds: odds,
  mod: mod,
  partition: partition,
  split: split,
  split_DASH_str: split_DASH_str,
  interleave: interleave,
  zipmap: zipmap,
  zipobj: zipobj,
  extend_DASH_attr: extend_DASH_attr,
  cons: cons,
  gensym: gensym,
  carve: carve,
  hash_DASH_map: hash_DASH_map,
  hash_DASH_set: hash_DASH_set,
  assoc_BANG: assoc_BANG,
  dissoc_BANG: dissoc_BANG,
  truthy_QMRK: truthy_QMRK,
  falsy_QMRK: falsy_QMRK,
  flatten: flatten,
  identity: identity,
  quote_DASH_str: quote_DASH_str,
  unquote_DASH_str: unquote_DASH_str,
  esc_DASH_xml: esc_DASH_xml,
  split_DASH_seq: split_DASH_seq,
  select_DASH_keys: select_DASH_keys,
  update_DASH_in_BANG: update_DASH_in_BANG,
  get_DASH_in: get_DASH_in,
  merge: merge,
  mixin: mixin,
  aclone: aclone,
  difference: difference,
  inc: inc,
  dec: dec,
  percent: percent,
  rtti: rtti,
  str_STAR: str_STAR,
  to_DASH_fixed: to_DASH_fixed,
  mapcat: mapcat,
  ensure_DASH_test: ensure_DASH_test,
  ensure_DASH_test_DASH_thrown: ensure_DASH_test_DASH_thrown,
  run_DASH_test: run_DASH_test,
  push_DASH_nsp: push_DASH_nsp,
  pop_DASH_nsp: pop_DASH_nsp,
  peek_DASH_nsp: peek_DASH_nsp,
  _STAR_ns_STAR: _STAR_ns_STAR,
  min_DASH_by: min_DASH_by,
  max_DASH_by: max_DASH_by,
  take_DASH_while: take_DASH_while,
  drop_DASH_while: drop_DASH_while,
  split_DASH_with: split_DASH_with,
  monad_DASH_state: monad_DASH_state,
  monad_DASH_list: monad_DASH_list,
  monad_DASH_maybe: monad_DASH_maybe,
  monad_DASH_identity: monad_DASH_identity,
  monad_DASH_continuation: monad_DASH_continuation

};
