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

  /**
   * @module
   */
  function _module(){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //namespace cache holding the list of namespaces
    const NS_CACHE =[new Map([["id", "user"], ["meta", null]])];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function peekNS(){
      return NS_CACHE[0]
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function popNS(){
      return (NS_CACHE.length>1) ? NS_CACHE.shift() : UNDEF
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @param {string} nsp namespace
     * @param {object} info meta data
     * @return the namespace
     */
    function pushNS(nsp,info){
      NS_CACHE.unshift(new Map([["id", nsp], ["meta", info]]));
      return peekNS()
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @return current namespace id
    */
    function starNSstar(){
      let n = peekNS();
      return typeof(n) == "undefined" || n === null ? null : n.get("id")
    }

    /**
     * @class
    */
    class DArray extends Array{
      constructor(...args){ super(...args) }
    }

    /**
     * @class
    */
    class SPair extends Array{
      constructor(...args){ super(...args) }
    }

    /**
     * @class
     * @abstract
     */
    class SValue{
      constructor(a){ this.value=a }
      toString(){ return this.value }
    }

    /**
     * @class
    */
    class Keyword extends SValue{
      constructor(name){
        super(name)
      }
      toString(){
        return this.value.startsWith("::") ?
          [starNSstar(), "/", this.value.slice(2)].join("") :
          this.value.startsWith(":") ? this.value.slice(1) : null }
    }

    /**
     * @class
    */
    class SSymbol extends SValue{
      constructor(name){ super(name) }
    }

    /**
     * @class
    */
    class Atom extends SValue{
      constructor(val){ super(val) }
    }

    /**
     * @class
    */
    class JSObj{
      constructor(){}
    }

    /**
     * @exports
     */
    const _$={
      peekNS, popNS, pushNS,starNSstar,
      SValue,SPair,DArray,Atom,Keyword,SSymbol,JSObj
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module()
  }else{
    throw "Cannot run outside of NodeJS!"
  }

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

