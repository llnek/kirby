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
const _STAR_ns_DASH_cache_STAR =[new Map([["id", "user"], ["meta", null]])];
//////////////////////////////////////////////////////////////////////////////
function peekNS(){ return _STAR_ns_DASH_cache_STAR[0] }
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function popNS(){
  if(_STAR_ns_DASH_cache_STAR.length>1)
    return _STAR_ns_DASH_cache_STAR.shift();
}
//////////////////////////////////////////////////////////////////////////////
function pushNS(nsp,info){
  let o=new Map([["id", nsp], ["meta", info]]);
  _STAR_ns_DASH_cache_STAR.unshift(o);
  return o;
}
//////////////////////////////////////////////////////////////////////////////
function starNSstar(){
  let n = peekNS();
  return typeof(n) == "undefined" || n === null ? null : n.get("id")
}
//////////////////////////////////////////////////////////////////////////////
class DArray extends Array{ constructor(...args){ super(...args) }}
//////////////////////////////////////////////////////////////////////////////
class SPair extends Array{ constructor(...args){ super(...args) }}
//////////////////////////////////////////////////////////////////////////////
/** @abstract */
class SValue{
  constructor(a){ this.value=a }
  toString(){ return this.value }
}
//////////////////////////////////////////////////////////////////////////////
class Keyword extends SValue{
  constructor(name){
    super(name)
  }
  toString(){
    return this.value.startsWith("::") ?
      [starNSstar(), "/", this.value.slice(2)].join("") :
      this.value.startsWith(":") ? this.value.slice(1) : null;
  }
}
//////////////////////////////////////////////////////////////////////////////
class Symbol extends SValue{ constructor(name){ super(name) } }
//////////////////////////////////////////////////////////////////////////////
class Atom extends SValue{ constructor(val){ super(val) } }
//////////////////////////////////////////////////////////////////////////////
module.exports={
  SValue,SPair,DArray,Atom,Keyword,Symbol,
  peekNS, popNS, pushNS,starNSstar
};
//////////////////////////////////////////////////////////////////////////////
//EOF

