/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**
   * @module
   */
  function _module(fs,process){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const core=require("./core");

    /**
     * @class
     */
    class RegexObj extends core.SValue{
      constructor(v){ super(v) }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {SValue,DArray,SPair,Keyword,SSymbol,Atom,JSObj}=core;
    const MODULE_NAMESPACE = "__module_namespace__";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original source https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    if(typeof JSON.decycle != "function"){
      JSON.decycle=function decycle(object, replacer){
        let objects = new WeakMap();     // object to path mappings
        return (function derez(value,path){
          // The derez function recurses through the object, producing the deep copy.
          let nu;         // The new object or array
          let old_path;   // The path of an earlier occurance of value
          // If a replacer function was provided, then call it to get a replacement value.
          if(replacer !== undefined){ value = replacer(value) }
          // typeof null === "object", so go on if this value is really an object but not
          // one of the weird builtin objects.
          if(typeof value == "object" &&
             value !== null &&
             !(value instanceof Boolean) &&
             !(value instanceof Date) &&
             !(value instanceof Number) &&
             !(value instanceof RegExp) &&
             !(value instanceof String)){
            // If the value is an object or array, look to see if we have already
            // encountered it. If so, return a {"$ref":PATH} object. This uses an ES6 WeakMap.
            old_path = objects.get(value);
            if(old_path !== undefined){ return {$ref: old_path} }
            // Otherwise, accumulate the unique value and its path.
            objects.set(value, path);
            // If it is an array, replicate the array.
            if(Array.isArray(value)){
              nu = [];
              value.forEach(function(element, i){
                nu[i] = derez(element, path + "[" + i + "]");
              })
            }else{
              // If it is an object, replicate the object.
              nu = {};
              Object.keys(value).forEach(function(name){
                nu[name]= derez(value[name],
                                path + "[" + JSON.stringify(name) + "]")
              });
            }
            return nu;
          }
          return value;
        })(object, "$");
      }
    }
    if(typeof JSON.retrocycle != "function"){
      JSON.retrocycle=function retrocycle($){
        "use strict";
        let px=/^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
        (function rez(value) {
          if(value && typeof value == "object"){
            if(Array.isArray(value)){
              value.forEach(function(element,i){
                if(typeof element == "object" && element !== null){
                  let path = element.$ref;
                  if(typeof path == "string" && px.test(path)){
                    value[i] = eval(path);
                  }else{
                    rez(element);
                  }
                }
              })
            }else{
              Object.keys(value).forEach(function(name){
                let item = value[name];
                if(typeof item == "object" && item !== null){
                  let path = item.$ref;
                  if(typeof path == "string" && px.test(path)){
                    value[name] = eval(path);
                  }else{
                    rez(item);
                  }
                }
              });
            }
          }
        }($));
        return $;
      };
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function println(...msgs){
      if(console) console.log(msgs.join(""))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function throwE(msg,line){
      throw Error(typeof(line)=="number" ? [msg,` near line: ${line}`].join("") : msg)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isSequential(o){
      return isVec(o) || isPair(o) || Array.isArray(o)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isPair(a,checkEmpty){
      return a instanceof SPair ? (checkEmpty?a.length>0:true) : false
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isVec(a,checkEmpty){
      return a instanceof DArray ? (checkEmpty?a.length>0:true) : false
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function rtti(v){ return Object.prototype.toString.call(v) }
    function isNichts(o){return o===null || o===undefined}
    function rttiQ(v,t){return rtti(v)==t}
    function isEven(n){return n%2===0}
    function isOdd(n){return n%2!==0}
    function isStr(o){return typeof(o)=="string"}
    function isNum(o){return typeof(o)=="number"}
    function isBool(o){return typeof(o)=="boolean"}
    function isJSObj(x){return x instanceof JSObj}
    function isJSSet(x){return rttiQ(x,"[object Set]")}
    function isJSMap(x){return rttiQ(x,"[object Map]")}

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isSimple(o){
      return isNichts(o) || isStr(o) || isNum(o) || isBool(o)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isKeyword(o,what){
      return o instanceof Keyword ? (what ? what==o.value : true) : false
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isSymbol(o,what){
      return o instanceof SSymbol ? (what ? what==`${o}` : true) : false
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isMap(o){
      return o instanceof Map
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isSet(o){
      return o instanceof Set
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isAtom(o){
      return o instanceof Atom
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function copyPair(v){
      let r=new SPair();
      v.forEach(z=>r.push(z));
      return r
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function copyVec(v){
      let r=new DArray();
      v.forEach(z=>r.push(z));
      return r
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function toVec(...xs){
      let r=new DArray();
      xs.forEach(z=>r.push(z));
      return r
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function toPair(...xs){
      let r=new SPair();
      xs.forEach(z=>r.push(z));
      return r
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function pair(...xs){
      return toPair(...xs)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _trap(e){ throw (e || "error") }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**true if both are equal. */
    function isEQ(a,b){
      let ok=false;
      if(isJSMap(a) && isJSMap(b)){
        if(a.size==b.size) try{
          a.forEach((v, k)=> isEQ(b.get(k), v) ? 0 : _trap());
          ok=true;
        }catch(e){}
      }else if(isJSSet(a) && isJSSet(b)){
        if(a.size==b.size) try{
          a.forEach((v, k)=> b.has(v) ? 0 : _trap());
          ok=true;
        }catch(e){}
      }else if(isJSObj(a) && isJSObj(b)){
        let ksa=Object.keys(a),
            ksb=Object.keys(b);
        if(isEQ(new Set(ksa),new Set(ksb))) try{
          ksa.forEach(k=> isEQ(a[k],b[k]) ? 0 : _trap());
          ok=true;
        }catch(e){}
      }else if((isPair(a)&&isPair(b)) ||
               (isVec(a)&&isVec(b)) ||
               (Array.isArray(a) && Array.isArray(b))){
        if(a.length==b.length) try{
          a.forEach((v,i)=> isEQ(v,b[i]) ? 0 : _trap());
          ok=true;
        }catch(e){}
      }else if(isSymbol(a) && isSymbol(b)){
        ok= a.value == b.value
      }else if(isKeyword(a) && isKeyword(b)){
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Escape XML special chars. */
    function escXml(s){
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**conj[oin]. Returns coll with the xs 'added'.
     * (conj! nil item) returns (item).
     * If coll is a list, prepends else appends to coll. */
    function conjBANG(coll,...xs){
      if(isPair(coll)){
        xs.forEach(a=>coll.unshift(a))
      }else if(isVec(coll) ||
               Array.isArray(coll)){
        xs.forEach(a=>coll.push(a))
      }else if(coll instanceof Map){
        xs.forEach(a=>{
          if(!Array.isArray(a) ||
             a.length!==2)
            _trap("bad arg: conj!");
          coll.set(a[0],a[1]);
        })
      }else if(coll instanceof Set){
        xs.forEach(a=>coll.add(a))
      }else{
        _trap(`Cannot conj! with: ${rtti(coll)}`)
      }
      return coll;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Add entry to map */
    function assocBANG(coll,...xs){
      if(!(coll instanceof Map))
        _trap(`Cannot assoc! with: ${rtti(coll)}`);
      if(xs.length%2 !== 0)
        _trap("assoc! expecting even n# of args");
      for(let i=0; i<xs.length; i += 2){
        coll.set(xs[i], xs[i+1])
      }
      return coll;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Like conj! but returns a new collection. */
    function conj(coll,...xs){
      let r;
      if(isVec(coll)){
        r=copyVec(coll)
      }else if(isPair(coll)){
        r=copyPair(coll)
      }else if(coll instanceof Map){
        r=new Map(coll.entries());
      }else if(coll instanceof Set){
        r=new Set(coll.values());
      }else if(Array.isArray(coll)){
        r=coll.slice();
      }else if(coll===null){
        r= toPair();
      }else{
        _trap(`Cannot conj with: ${typeof(coll)}`)
      }
      return r ? conjBANG(r,...xs) : null;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mod(x,N){
      return x<0 ? (x - (-1 * (N + (Math.floor(((-1 * x) / N)) * N)))) : (x % N) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function optQQ(a,b){
      return a===undefined?b:a
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Generates next random symbol. */
    let GENSYM_COUNTER = 0;
    function gensym(pfx){
      let x= ++GENSYM_COUNTER;
      return new SSymbol(`${optQQ(pfx, "GS__")}${x}`);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function symbol(v){
      return new SSymbol(v)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function keyword(v){
      return new Keyword(v)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Add quotes around a string. */
    function quoteStr(s){
      let ch,out = "\"";
      if(isStr(s))
        for(let i=0; i<s.length; ++i){
          ch= s.charAt(i);
          if(ch == "\""){
            out += "\\\""
          }else if(ch == "\n"){
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
            out += "u" == s.charAt(i+1) ? ch : "\\\\"
          }else{
            out += ch
          }
        }
      return out += "\"";
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Removes quotes around a string. */
    function unquoteStr(s){
      if(isStr(s) && s.startsWith("\"") && s.endsWith("\"")){
        let out=""
        s= s.slice(1, -1);
        for(let nx,ch,i=0;i<s.length;++i){
          ch=s.charAt(i);
          if(ch== "\\"){
            ++i;
            nx=s.charAt(i);
            if(nx== "\""){
              out += "\""
            }else if(nx== "\\"){
              out += "\\"
            }else if(nx== "n"){
              out += "\n"
            }else if(nx== "t"){
              out += "\t"
            }else if(nx== "f"){
              out += "\f"
            }else if(nx== "v"){
              out += "\v"
            }else if(nx== "r"){
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**If prop is a string, returns the value of this object property,
     * obeying the own? flag, unless if object is a Map, returns value of the key.
     * Otherwise, return the value at the index of the array. */
    function getProp(obj, prop, isown){
      let rc=null;
      if(obj instanceof Map){
        rc=obj.get(prop)
      }else if(obj instanceof Set && isNum(prop)){
        rc=Array.from(obj.values())[prop]
      }else if(Array.isArray(obj) && isNum(prop)){
        rc=obj[prop]
      }else if(!isSimple(obj) && isStr(prop)){
        if(isown===true &&
           !obj.hasOwnProperty(prop)){}else{ rc=obj[prop] }
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isObject(o){ return isJSObj(o) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Splits string on a sep or regular expression.  Optional argument limit is
     * the maximum number of splits. Returns vector of the splits. */
    function split(s, re, limit){
      if(!isStr(s))
        _trap(`Cannot split with: ${rtti(s)}`);
      let out=toPair(),
          rc= typeof(limit) != "undefined" ? s.split(re, limit) : s.split(re)
      rc.forEach(c=>out.push(c));
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**If coll is empty, returns nil, else coll. */
    function notEmpty(coll){
      let n=0;
      if(coll instanceof Map || coll instanceof Set){
        n=coll.size
      }else if(Array.isArray(coll) || isStr(coll)){
        n=coll.length
      }else if(isJSObj(coll)){
        n=Object.keys(coll).length
      }
      return n>0?coll:null;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Count the number of elements inside. */
    function count(coll){
      let rc=0;
      if(Array.isArray(coll)||isStr(coll)){
        rc=coll.length
      }else if(coll instanceof Map||coll instanceof Set){
        rc=coll.size
      }else if(coll){
        _trap(`Cannot count with: ${rtti(coll)}`)
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Adds one element to the beginning of a collection. */
    function consBANG(x, coll){
      if(Array.isArray(coll)){
        coll.unshift(x)
      }else{
        _trap(`Cannot cons! with: ${rtti(coll)}`)
      }
      return coll;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns the last element. */
    function last(coll){
      return (isStr(coll)||isSequential(coll)) && coll.length>0 ? coll[coll.length-1] : null
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**true if item is inside. */
    function contains(coll, x){
      let rc=null;
      if(coll instanceof Map||coll instanceof Set){
        rc=coll.has(x)
      }else if(Array.isArray(coll)||isStr(coll)){
        rc=coll.includes(x)
      }else{
        _trap(`Cannot contains? with: ${rtti(coll)}`)
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Merge maps
    function mergeBANG(base, m){
      let src= m || new Map(),
          ret= base || new Map();

      if(!(isJSMap(ret)||isJSObj(ret))) _trap("bad arg to merge!");
      if(!(isJSMap(src)||isJSObj(src))) _trap("bad arg to merge!");

      function loop(v, k){
        return ret instanceof Map ? ret.set(k, v) : (ret[k]=v) }

      if(src instanceof Map){
        src.forEach(loop)
      }else{
        Object.keys(src).forEach(p=> loop(src[p], p))
      }

      return ret;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a map that consists of the rest of the maps conj-ed onto
     * the first.  If a key occurs in more than one map, the mapping from
     * the latter (left-to-right) will be the mapping in the result. */
    function merge(...xs){
      return xs.reduce((acc, o)=> mergeBANG(acc, o) , new Map())
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a new seq where x is the first element and seq is the rest. */
    function cons(x, coll){
      if(!isSequential(coll))
        _trap(`Cannot cons with: ${rtti(coll)}`);
      let rc=copyPair(coll);
      rc.unshift(x);
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
      })([]);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Print data as string - use to dump an AST node. */
    function prn(obj,rQ){
      //check for no cyclic reference
      let f=noCRef();
      f(undefined,obj);
      return prnEx(obj, rQ, f);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @private */
    function prnArr(obj, rQ, f){
      return obj.map((v,i)=> prnEx(f(i,v), rQ,f)).join(" ")
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @private */
    function prnEx(obj, rQ, func){
      let pfx = a=>prnEx(a, rQ, func),
          c3, parr= (a,b)=> wrapStr(prnArr(obj, rQ, func), a,b);
      if(obj instanceof Atom){
        c3 = wrapStr(pfx(obj.value), "(atom ", ")");
      }else if(obj instanceof SValue){
        c3=obj.value;
      }else if(obj instanceof Map){
        let x,acc=[];
        obj.forEach((v,k)=>{
          if(!isNichts(v)){
            x = func(k, v);
            v= typeof(x)=="undefined"? "!!!!cyclic reference!!!!": x; }
          acc.push(`${pfx(k)} ${pfx(v)}`);
        });
        c3 = wrapStr(acc.join(" "), "{", "}");
      }else if(obj instanceof Set){
        let x,acc=[];
        obj.forEach(v=>{
          if(!isNichts(v)){
            x = func(undefined, v);
            v= typeof(x)=="undefined"? "!!!!cyclic reference!!!!": x; }
          acc.push(`${pfx(v)}`);
        });
        c3 = wrapStr(acc.join(" "), "#{", "}");
      }else if(isPair(obj)){
        c3 = parr("(", ")")
      }else if(isVec(obj)){
        c3= parr("[", "]")
      }else if(isJSObj(obj)){
        let x,v,acc= Object.keys(obj).reduce((acc, k)=>{
          v=obj[k];
          if(!isNichts(v)){
            x = func(k, v);
            v= typeof(x)=="undefined"? "!!!!cyclic reference!!!!": x; }
          acc.push(`${pfx(k)} ${pfx(v)}`);
          return acc;
        },[]);
        c3 = wrapStr(acc.join(" "), "(js-obj ", ")");
      }else if(isStr(obj)){
        c3 = rQ ? quoteStr(obj) : obj;
      }else if(obj===null){
        c3="nil"
      }else if(obj===undefined){
        c3="undefined"
      }else if(Array.isArray(obj)){
        c3= parr("(", ")")
      }else if(typeof(obj)=="boolean" || typeof(obj)=="number" || obj){
        c3=obj.toString()
      }
      return c3;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Returns a sequence of successive items from coll while
    //(pred item) returns logical true. pred must be free of side-effects.
    function takeWhile(pred,coll){
      let ret= [];
      for(let c,i=0;i<coll.length;++i){
        c=coll[i];
        if(!pred(c)){break}
        ret.push(c);
      }
      return ret;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Returns a sequence of the items in coll starting from the
    //first item for which (pred item) returns logical false.
    function dropWhile(pred,coll){
      let ret=[];
      for(let c,i=0;i<coll.length;++i){
        c=coll[i];
        if(!pred(c)){
          ret=coll.slice(i); break; }
      }
      return ret;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a list of [(take-while pred coll) (drop-while pred coll)] */
    function splitWith(pred, coll){
      return toPair(takeWhile(pred, coll), dropWhile(pred, coll))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Split a collection into 2 parts
    function splitSeq(coll,cnt){
      let x=new SPair(),
          y=new SPair();
      if(cnt<coll.length){
        for(let i=0;i<cnt;++i) x.push(coll[i]);
        for(let i=cnt;i<coll.length;++i) y.push(coll[i]);
      }else{
        x=into(x, coll);
      }
      return [x,y];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a seq of the items in coll in reverse order.
     * If rev is empty returns nil. */
    function rseq(obj){
      let rc=toPair();
      if(isStr(obj)){
        obj.split("").forEach(c=>rc.unshift(c));
      }else if(obj instanceof Map){
        obj.forEach((v,k)=>rc.unshift(toVec(k,v)));
      }else if(obj instanceof Set){
        obj.values().forEach(v=>rc.unshift(v));
      }else if(Array.isArray(obj)){
        obj.forEach(a=>rc.unshift(a));
      }else{
        _trap(`Cannot rseq with: ${rtti(obj)}`)
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a sequence of lists of n items each. */
    function partition(n, coll){
      let recur = null,
          _x_ = null,
          _r_, _zz_=new Object();
      function _f_(ret, [x,y]){
        if(notEmpty(x)){ ret.push(x) }
        return 0 == count(y) ? ret : recur(ret, splitSeq(y, n)) }
      _r_ = _f_;
      recur=function(){
        _x_=arguments;
        if(_r_ !== _zz_){
          _r_=_zz_;
          while(_r_ === _zz_)
            _r_= _f_.apply(this,_x_);
          return _r_;
        }
        return _zz_;
      };
      if(Array.isArray(coll))
        return recur(toPair(), splitSeq(coll, n));
      if(!coll){
        return toPair()
      }else{
        _trap(`Cannot partition with: ${rtti(coll)}`)
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Prepend and append strings to the object. */
    function wrapStr(obj, start, end){
      return [start, obj, end].join("")
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a sequence. */
    function seq(obj){
      let rc=toPair();
      if(isStr(obj)){
        obj.split("").forEach(c=>rc.push(c));
      }else if(obj instanceof Map){
        obj.forEach((v,k)=>rc.push(toVec(k,v)));
      }else if(obj instanceof Set){
        obj.forEach(v=>rc.push(v));
      }else if(Array.isArray(obj)){
        obj.forEach(a=>rc.push(a));
      }else if(isJSObj(obj)){
        Object.keys(obj).forEach(k=>{
          rc.push(toVec(k,obj[k]))
        });
      }else{
        _trap(`Cannot seq with: ${rtti(obj)}`)
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function vector(...xs){ return toVec(...xs) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function hashmap(...xs){
      if(xs.length%2 !== 0)
        _trap("Arity Error: even n# expected.");
      let out=new Map();
      for(let i=0;i<xs.length;i+=2){
        out.set(`${xs[i]}`,xs[i+1])
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function atom(v){ return new Atom(v) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**LISP falsy. */
    function isFalsy(a){ return a === null || a === false }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function hashset(...xs){ return new Set(xs) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**JSON stringify (no cyclical obj-ref) */
    function stringify(obj){
      return obj? JSON.stringify(JSON.decycle(obj)) : null
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns a new coll consisting of to-coll with all of the items of from-coll conjoined. */
    function into(to, coll){
      if(isPair(to) || isVec(to)){
        if(Array.isArray(coll)) coll.forEach(z=>to.push(z));
      }else{
        _trap(`Cannot into with: ${rtti(to)} to ${rtti(coll)}`)
      }
      return to;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function object(...xs){
      if(xs.length%2 !== 0)
        _trap("Invalid arity for: object");
      let rc=new JSObj();
      for(let i=0;i<xs.length; i+=2){
        rc[xs[i]]=xs[i+1]
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Add many to this collection. */
    function concat(coll,...xs){
      let rc=new SPair();
      seq(coll).forEach(z=> rc.push(z));
      xs.forEach(c=> seq(c).forEach(z=> rc.push(z)));
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function repeatEvery(coll, start, step){
      let rc;
      if(Array.isArray(coll)){
        rc=toPair();
        for(let i=start,end=coll.length; i<end; i += step){
          rc.push(coll[i])
        }
      }else{
        _trap(`Cannot repeat-every with: ${rtti(coll)}`)
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Collect every 2nd item starting at 0. */
    function evens(coll){ return repeatEvery(coll, 0, 2) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Collect every 2nd item starting at 1. */
    function odds(coll){ return repeatEvery(coll, 1, 2) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function requireJS(path,panic){
      try{
        if(path=="kirby"){
          path="./stdlib.js";
        }
        return require(path)
      }catch(e){
        if(panic)
          throw e;
        //console.log(e);
        println("warning: failed to load lib: ", path);
        //console.log(new Error().stack);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      SValue,SPair,DArray,Atom,RegexObj,Keyword,SSymbol,
      requireJS,
      println,
      throwE,
      isSequential,
      rtti,
      isNichts,
      isEven,
      isOdd,
      isStr,
      isNum,
      isBool,
      isJSSet,
      isJSMap,
      isJSObj,
      isSimple,
      isKeyword,
      isSymbol,
      isVec,
      isMap,
      isSet,
      isAtom,
      pair,
      isEQ,
      escXml,
      conjBANG,
      assocBANG,
      conj,
      mod,
      optQQ,
      gensym,
      symbol,
      keyword,
      quoteStr,
      unquoteStr,
      getProp,
      isPair,
      isObject,
      split,
      notEmpty,
      count,
      consBANG,
      last,
      contains,
      mergeBANG,
      merge,
      cons,
      prn,
      takeWhile,
      dropWhile,
      splitWith,
      rseq,
      partition,
      wrapStr,
      seq,
      vector,
      hashmap,
      atom,
      isFalsy,
      hashset,
      stringify,
      into,
      object,
      concat,
      evens,
      odds,
      splitSeq,
      repeatEvery,

      MODULE_NAMESPACE: MODULE_NAMESPACE
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module(require("fs"), require("process"))
  }else{
    throw "Cannot run outside of NodeJS!"
  }

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

