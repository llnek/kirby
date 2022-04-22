/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */


;(function(gscope){

  "use strict";

  function _module(){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const readline = require("readline");
    const fs = require("fs");
    const core = require("./core");
    const std = require("./kernel");
    const rdr = require("./reader");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const macro_assert = "(macro* assert* [c msg] `(if* ~c true (throw* ~msg)))";
    const GLOBAL = typeof(window) == "undefined" ? undefined : window;
    const EXPKEY = "da57bc0172fb42438a11e6e8778f36fb";
    const KBSTDLR = "kirbyref";
    const KBPFX = "czlab.kirby.";
    const KBSTDLIB = `${KBPFX}stdlib`;
    const {throwE,println}=std;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _expect(k){ if(!std.isSymbol(k)) throwE("expected symbol") }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Lexical Environment */
    class LEXEnv{
      /**Create and initialize a new env with these symbols, optionally a parent env */
      constructor(parent, vars=[], vals=[]){
        this.data = new Map();
        this.par = null;
        if(parent)
          this.par = parent;
        for(let ev,e,i=0; i<vars.length; ++i){
          e= vars[i],
            ev= e.value;
          if(ev.startsWith("&")){
            //deal with [&xs] arg
            this.data.set(ev=="&" ? `${vars[i+1]}` : ev.slice(1), vals.slice(i));
            break;
          }
          this.data.set(ev, vals[i])
        }
      }
      /**Find the env containing this symbol */
      find(k){
        _expect(k);
        if(this.data.has(k.value)) return this;
        if(this.par) return this.par.find(k);
      }
      /**Bind this symbol, value to this env */
      set(k, v){
        _expect(k);
        if(this.data.has(k.value))
          throwE(`var: ${k} already exists`);
        this.data.set(k.value, v);
        return v;
      }
      mod(k, v){
        _expect(k);
        if(!this.data.has(k.value))
          throwE(`Unbound var: ${k} to set`);
        this.data.set(k.value, v);
        return v;
      }
      /**Get value of this symbol */
      get(k){
        _expect(k);
        let env = this.find(k);
        if(!env) throwE(`Unbound var: ${k}`);
        return env.data.get(k.value);
      }
      /**Print set of vars */
      prn(){
        return std.prn(this.data,true)
      }
      select(what){
        let c6,acc=new Map();
        this.data.forEach(function(v,k){
          c6=true;
          switch(what){
            case "fn":
              c6 = typeof(v) == "function";
              break;
            case "var":
              c6 = typeof(v) != "function";
              break;
          }
          if(c6)
            acc.set(`${k}`,v);
        });
        return acc;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _STAR_vars_STAR = new Map();
    const _STAR_libs_STAR = new Map();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getLib(alias){
      return _STAR_libs_STAR.get(alias) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getLibKeys(){
      return Array.from(_STAR_libs_STAR.keys()) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addVar(sym, info){
      let
        s = `${sym}`,
        m = _STAR_vars_STAR.get(s);
      if(m)
        throwE(`var: "${s}" already added`);
      _STAR_vars_STAR.set(s, info);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getVar(sym){
      return _STAR_vars_STAR.get(`${sym}`) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getVarKeys(){
      return Array.from(_STAR_vars_STAR.keys()) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function hasVar(sym){
      return _STAR_vars_STAR.has(`${sym}`) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function addLib(alias, lib){
      //console.log(`adding lib ${alias}`);
      if(_STAR_libs_STAR.has(alias))
        throwE(`Library alias already added: ${alias}`);
      _STAR_libs_STAR.set(alias, lib);
      return lib;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function prnLn(...xs){
      return xs.map(a=> std.prn(a)).forEach(a=> println(a)) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function prnStr(...xs){
      return xs.map(a=> std.prn(a)).join(" ") }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function slurp(f){
      return fs.readFileSync(f, "utf-8") }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function spit(f, s){
      fs.writeFileSync(f, s, "utf-8") }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function cloneJS(obj){
      function fcp(orig){
        function cloned(...xs){ return orig.apply(this, xs) }
        function cp(v, k){ cloned[k] = v }
        if(typeof(orig.forEach)!="undefined"){
          orig.forEach(cp)
        }else{
          Object.keys(orig).forEach(p=> cp(orig[p], p))
        }
        return cloned;
      }
      let rc;
      if(std.isVec(obj)){
        rc=std.into(std.vector(),obj)
      }else if(std.isJSMap(obj)){
        rc=new Map(obj.entries());
      }else if(std.isJSSet(obj)){
        rc=new Set(obj.values())
      }else if(std.isPair(obj)){
        rc=std.into(std.pair(),obj)
      }else if(std.isStr(obj) || Array.isArray(obj)){
        rc=obj.slice()
      }else if(typeof(obj)=="function"){
        rc=fcp(obj)
      }else if(std.isJSObj(obj)){
        rc={};
        Object.keys(obj).forEach(k=>{ rc[k]=obj[k] });
      }else{
        throwE(`clone of non-collection: ${obj}`)
      }
      return rc
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Get rid of possible cyclic refs */
    function filterJS(obj){
      let s = std.stringify(obj); if(s) return JSON.parse(s); }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Sort out *this* */
    function resolveJS(s){
      return [s.includes(".") ? eval(/^(.*)\.[^\.]*$/g.exec(s)[1]) : GLOBAL, eval(s)] }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function withMeta(obj, m){
      obj= cloneJS(obj); obj["____meta"] = m; return obj; }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function meta(obj){
      if(std.isSimple(obj))
        throwE(`can't get meta from: ${std.rtti(obj)}`);
      return obj["____meta"];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Eval some js code */
    function evalJS(s){
      if(s) return filterJS(eval(s.toString())) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Invoke some method on some *this* object */
    function invokeJS(method,...xs){
      let [obj,f] = resolveJS(method);
      return filterJS(f.apply(obj, xs));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _intrinsics_ = new Map([

      ["macroexpand*", (a,e)=> println(std.prn(expandMacro(a, e || g_env))) ],

      ["macros*", fout=>{ let s = std.prn(CACHE);
                          return fout ? spit(fout, s) : println(s); }],

      ["env*", (what,env,fout)=>{ let s = std.prn((env||g_env).select(what));
                                  return fout ? spit(fout, s) : println(s); }],

      ["slice*", function(arr,...xs){ return arr.slice(...xs) }],
      ["throw*", function(...xs){ throwE(xs.join("")) }],
      ["str*", function(...xs){ return xs.join("") }],

      ["obj-type*", std.rtti],
      ["gensym*", std.gensym],
      ["is-eq?", std.isEQ],

      ["is-some?", o=> o!==undefined && o!==null ],
      ["is-str?", a=> typeof(a) == "string" ],

      ["identity*", function(x){ return x }],
      ["false?", a=> a === false ],
      ["true?", a=> a === true ],
      ["is-nil?", a=> a===null ],
      ["is?", (a,b)=> a===b ],

      ["is-keyword?", std.isKeyword],
      ["is-symbol?", std.isSymbol],
      ["keyword*", std.keyword],
      ["symbol*", std.symbol],
      ["println*", prnLn],
      ["prn*", prnStr],
      ["slurp*", slurp],
      ["spit*", spit],

      ["<", (a,b)=> a<b ],
      [">", (a,b)=> a > b ],

      [">=", (a,b)=> a >= b ],
      ["<=", (a,b)=> a <= b ],

      ["/", function(A,...xs){ return xs.reduce((a,b)=> a/b, A) }],
      ["+", function(...xs){ return xs.reduce((a,b)=> a+b, 0) }],
      ["-", function(A,...xs){ return xs.reduce((a,b)=> a-b, A) }],
      ["*", function(...xs){ return xs.reduce((a,b)=> a*b, 1) }],

      ["not=", (a,b)=> a !== b ],
      ["!=", (a,b)=> a != b ],
      ["=", (a,b)=> a === b ],
      ["==", (a,b)=> a == b ],

      ["is-contains?", std.contains],
      ["is-vector?", std.isVec],
      ["is-pair?", std.isPair],
      ["is-map?", std.isJSMap],
      ["is-set?", std.isJSSet],

      ["object*", std.object],
      ["vector*", std.vector],
      ["list*", std.pair],

      ["hashmap*", function(...xs){ return std.hashmap(...xs) }],
      ["hashset*", function(...xs){ return std.hashset(...xs) }],

      ["values*", a=> std.into(std.pair(),Array.from(a.values())) ],
      ["keys*", a=> std.into(std.pair(),Array.from(a.keys())) ],

      ["get*", (a,b)=> std.getProp(a,b) ],
      ["not*", a=> a ? false : true ],
      ["dec*", a=> a - 1 ],
      ["inc*", a=> a + 1 ],

      ["is-even?", a=> 0 == std.mod(a, 2) ],
      ["is-odd?", a=> 1 == std.mod(a, 2) ],

      ["is-sequential?", std.isSequential],
      ["concat*", std.concat],
      ["count*", std.count],
      ["cons*", std.cons],

      ["rest*", a=> a ? a.slice(1) : std.pair() ],

      ["nth*", (coll,pos)=> std.getProp(coll,pos) ],
      ["first*", a=> std.getProp(a, 0) ],
      ["is-empty?", a=> 0 == std.count(a) ],
      ["not-empty*", std.notEmpty],

      ["apply*", function(f,...xs){ return f.apply(this, xs) }],
      ["partition*", std.partition],

      ["map*", function(f, arr){
        let out=std.pair();
        if(arr && typeof(arr.length)!="undefined"){
          for(let i=0;i<arr.length;++i) out.push(f(arr[i],i,arr))
        }
        return out;
      }],

      ["evens*", std.evens],
      ["odds*", std.odds],
      ["meta*", meta],
      ["conj*", std.conj],
      ["seq*", std.seq],
      ["is-atom?", std.isAtom],
      ["atom*", std.atom],
      ["deref*", function(a){
        if(std.isAtom(a)) return a.value;
      }],
      ["reset*", function(a){
        if(std.isAtom(a)) a.value=null;
        return a;
      }],
      ["swap*", function(a, f,...xs){
        let v = f.apply(this, [a.value].concat(xs));
        return (a.value=v);
      }],

      ["with-meta*", withMeta],
      ["js-eval*", evalJS],
      ["js*", invokeJS],

      ["type*", a=> typeof(a) ]

    ]);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const CACHE = new Map();
    /**Register a new macro */
    function setMacro(cmd, func){
      if(cmd && typeof(func) == "function"){
        cmd = `${cmd}`;
        //only add namespace'd macro
        if(!cmd.includes("/")){
          let c = core.peekNS();
          if(!c)
            throwE("setMacro: macro ${cmd} has no namespace");
          cmd = `${c.get("id")}/${cmd}`;
        }
        //console.log(`added macro: ${cmd}`);
        CACHE.set(cmd, func);
      }else{
        func=null;
      }
      return func;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Get macro */
    function getMacro(cmd){
      let mc, nsp,skip,mname;
      cmd = `${cmd}`;
      mc=null;
      if(cmd != "/" && cmd.includes("/")){
        let [p,c] = cmd.split("/");
        let tmp, libObj = getLib(p);
        mname = c;
        if(p == KBSTDLR){
          //from kirby
          nsp = KBSTDLIB
        }else if(std.isNichts(libObj) ||
                 !std.getProp(libObj, EXPKEY)){
          //non standard!
          skip = true
        }else{
          nsp = std.getProp(std.getProp(libObj, EXPKEY), "ns")
        }
      }else{
        //meta data for the var
        let m = getVar(cmd);
        mname = cmd;
        nsp = m ? std.getProp(m, "ns") : null;
      }
      if(!skip){
        if(nsp === null &&
           CACHE.get(`${KBSTDLIB}/${mname}`)){
          nsp = KBSTDLIB
        }
        if(typeof(nsp) == "string")
          mc=CACHE.get(`${nsp}/${mname}`);
      }
      return mc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function readAST(s){
      let ret = rdr.parse(s);
      if(Array.isArray(ret) && 1 == ret.length){
        ret = ret[0]
      }
      return ret;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function backtick(ast){
      let rc, lstQ= a=> std.isSequential(a) && std.notEmpty(a);
      if(!lstQ(ast)){
        rc=std.pair(std.symbol("quote"), ast)
      }else if(std.isSymbol(ast[0],"unquote")){
        rc=ast[1]
      }else if(lstQ(ast[0]) &&
               std.isSymbol(ast[0][0],"splice-unquote")){
        rc=std.pair(std.symbol("concat*"), ast[0][1], backtick(ast.slice(1)))
      }else{
        rc=std.pair(std.symbol("cons*"), backtick(ast[0]), backtick(ast.slice(1)))
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function isMacroCall(ast, env){
      return std.isPair(ast,1) && std.isSymbol(ast[0]) && getMacro(`${ast[0]}`) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Continue to expand if the expr is a macro */
    function expandMacro(ast,env,mcObj){
      let mac,cmd;
      env=env || genv();
      for(; mcObj || isMacroCall(ast, env);){
        if(mcObj){
          mac=mcObj
          mcObj = null;
        }else{
          cmd = `${ast[0]}`;
          mac = getMacro(cmd);
        }
        //console.log(mac?"found macro!!!":"missing macro!!!");
        ast = mac.apply(this, ast.slice(1));
      }
      return ast;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal (and* a b c) */
    function doAND(ast, env){
      let ret = true;
      for(let i=1;i<ast.length; ++i){
        if(std.isFalsy(ret=compute(ast[i], env))) break; } return ret; }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal (or* a b c) */
    function doOR(ast, env){
      let ret = null;
      for(let i=1;i<ast.length; ++i){
        if(!std.isFalsy(ret=compute(ast[i], env))) break; } return ret; }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal (let* [x 1 y 2] ...) */
    function doLET(ast, env){
      let
        binds = ast[1],
        e = new LEXEnv(env);
      for(let i=0;i<binds.length; i+=2){
        e.set(binds[i], compute(binds[i+1], e))
      }
      return std.pair(ast[2], e);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal (macro* name (args) body) */
    function doMACRO(ast, env){
      let
        cmd= `${ast[1]}`,
        mc, name, nsp = core.peekNS();
      nsp = nsp ? nsp.get("id") : KBSTDLIB;
      name=cmd;
      //ast[2]===args, ast[3]===body
      mc= fnToNative(ast[2], ast[3], env);
      if(!cmd.includes("/")){
        name= `${nsp}/${cmd}`
      }
      setMacro(name, mc);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal (try blah ) */
    function doTRY(ast, env){
      let a3 = ast[2];
      try{
        return compute(ast[1], env)
      }catch(e){
        if(a3 && "catch*" == `${a3[0]}`){
          if(e instanceof Error){ e = e.message }
          return compute(a3[2], new LEXEnv(env, [a3[1]], [e])) }
        throw e;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** internal (if test ok elze), only test is eval'ed, ok and elze are not. */
    function doIF(ast, env){
      let
        a3 = ast[3],
        test = compute(ast[1], env);
      return !std.isFalsy(test) ? ast[2] : typeof(a3) != "undefined"? a3 : null }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Wrap the function body and args inside a native js function */
    function fnToNative(fargs, fbody, env){
      //wrap around a macro
      return function(...args){ return compute(fbody, new LEXEnv(env, fargs, args)) } }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _spec_forms_ = new Map([

      ["lambda*", (a,env)=> std.atom(fnToNative(a[1], a[2], env)) ],
      //a[1] == args a[2] == body
      ["def*", (a,e)=> std.atom(e.set(a[1], compute(a[2], e))) ],
      ["set*", (a,e)=> std.atom(e.mod(a[1], compute(a[2], e))) ],
      ["and*", (a,b)=> std.atom(doAND(a,b)) ],
      ["or*", (a,b)=> std.atom(doOR(a,b)) ],

      ["quote", (a)=> std.atom(a[1]) ],
      ["let*", (a,b)=> doLET(a,b) ],

      ["syntax-quote", (a,b)=> std.pair(backtick(a[1]), b) ],
      ["macro*", (a,b)=> std.atom(doMACRO(a,b)) ],
      ["try*", (a,b)=> std.atom(doTRY(a,b)) ],
      ["if*", (a,b)=> std.pair(doIF(a,b), b) ],

      ["do*", (a,e)=>{ a.slice(1,-1).forEach(x=>compute(x,e)); return std.pair(a[a.length-1], e) }]
    ]);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function resolveSym(ast,env){
      let r,s= `${ast}`
      if(s=="*ns*"){
        r=core.peekNS().get("id")
      }else if(s=="*version*"){
        r=_STAR_version_STAR
      }else{
        r=env.get(ast)
      }
      return r;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Process the ast */
    function evalEx(ast, env){
      let rc=ast;
      if(std.isSimple(ast)){
        //primitive data
        rc=std.isStr(ast)?std.unquoteStr(ast): ast===undefined ? null : ast;
      }else if(std.isKeyword(ast)){
        //keyword data
        rc=`${ast}`
      }else if(std.isSymbol(ast)){
        //var data
        rc=resolveSym(ast,env);
      }else if(std.isVec(ast)){
        for(let i=0;i<ast.length;++i)
          ast[i]=compute(ast[i],env);
      }else if(ast instanceof Map ||
               ast instanceof Set){
        //console.log(std.prn(ast,true))
        //cool
      }else if(std.isPair(ast)){
        rc=std.pair();
        for(let i=0;i<ast.length;++i)
          rc.push(compute(ast[i],env));
      }else{
        throwE("eval* failed: " + std.prn(ast,1))
      }
      return rc;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Interpret a expression */
    function compute(expr, cenv){
      let _r_, _x_, _zz_=new Object();
      let recur, ret, env = cenv || g_env;
      function _f_(ast){
        let cmd,res;
        if(!std.isPair(ast)){
          res=std.atom(evalEx(ast, env))
        }else if(ast.length==0){
          res=std.atom(std.pair())
        }else{
          cmd = `${ast[0]}`;
          cmd = _spec_forms_.get(cmd);
          if(typeof(cmd)=="function"){
            res=cmd(ast,env)
          }else/*a general form*/{
            res=ast.map(a=>compute(a,env));
            cmd=res[0];
            res=std.atom(typeof(cmd)!="function"?res
                                                :cmd.apply(this, res.slice(1))) }
        }
        if(std.isPair(res)){
          env= res[1];
          res= recur(expandMacro(res[0], env)) }
        return res;
      }
      _r_ = _f_;
      recur=function(){
        _x_ = Array.prototype.slice.call(arguments,0);
        if(_r_ !== _zz_){
          _r_ = _zz_;
          while(_r_ === _zz_)
            _r_ = _f_.apply(this, _x_); return _r_; }
        return _zz_;
      };
      ret= recur(expandMacro(expr, env));
      return typeof(ret.value) == "undefined" ? null : ret.value;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Create a new interpreter environment */
    function newEnv(){
      let ret = new LEXEnv();
      _intrinsics_.forEach((v,k)=> ret.set(std.symbol(k), v)); return ret; }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Start a interactive session */
    const prefix = "kirby> ";
    function runRepl(){
      let ss = readline.createInterface(process.stdin, process.stdout);
      let z = prefix.length;
      function pt(){ ss.setPrompt(prefix, z); return ss.prompt() }
      function cl(){ println("Bye!"); return process.exit(0) }
      function rl(line){
        try{
          if(line=="qqq") cl();
          if(line)
            println(std.prn(compute(expandMacro(readAST(line))),1))
        }catch(e){
          println(e)
        }
        return pt();
      }
      ss.on("close", cl);
      ss.on("line", rl);
      init();
      println(prefix, "Kirby REPL v", _STAR_version_STAR);
      return pt();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    var _STAR_version_STAR = "";
    var inited= false;
    var g_env = null;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Returns the runtime environment */
    function genv(){ return g_env }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _loadMacros(){
      compute(expandMacro(readAST(macro_assert))) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Set up the runtime environment */
    function init(ver){
      if(!inited){
        const o={ ns:"user", vars:[], macros:{} };
        const lib={};
        inited= true;
        lib[EXPKEY]=o;
        g_env = newEnv();
        _STAR_version_STAR = ver;
        addLib(core.peekNS().get("id"),lib) && _loadMacros(); }
      return inited;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$ = {
      //the engine module is designed for handling a repl session, and for
      //assisting code generation by expanding designated macros.
      da57bc0172fb42438a11e6e8778f36fb: {
        ns: "czlab.kirby.engine",
        vars: ["EXPKEY", "KBSTDLR", "KBPFX", "KBSTDLIB", "LEXEnv", "getLib", "getLibKeys", "addVar", "getVar", "getVarKeys",  "hasVar","addLib", "slurp", "spit", "setMacro", "getMacro", "readAST", "expand??", "compute", "newEnv", "runRepl", "init", "genv"],
        macros: {}
      },
      EXPKEY: EXPKEY,
      KBSTDLR: KBSTDLR,
      KBPFX: KBPFX,
      KBSTDLIB: KBSTDLIB,
      LEXEnv: LEXEnv,
      getLib: getLib,
      getLibKeys: getLibKeys,
      addVar: addVar,
      getVar: getVar,
      hasVar: hasVar,
      getVarKeys: getVarKeys,
      addLib: addLib,
      slurp: slurp,
      spit: spit,
      setMacro: setMacro,
      getMacro: getMacro,
      readAST: readAST,
      expandMacro: expandMacro,
      compute: compute,
      newEnv: newEnv,
      runRepl: runRepl,
      init: init,
      genv: genv
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module()
  }else{
  }

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

