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
const readline = require("readline");
const fs = require("fs");
const rdr = require("./reader");
const std = require("./stdlib");
//////////////////////////////////////////////////////////////////////////////
const EXPKEY = "da57bc0172fb42438a11e6e8778f36fb";
const KBSTDLR = "kirbystdlibref";
const KBPFX = "czlab.kirby.";
const KBSTDLIB = `${KBPFX}stdlib`;
const macro_assert = "\n  (macro* assert* [c msg] `(if* ~c true (throw* ~msg))) ";
const GLOBAL = typeof(window) == "undefined" ? undefined : window;
const prefix = "kirby> ";
const println= std["println"];
//////////////////////////////////////////////////////////////////////////////
function _expect(k){
  if(k instanceof std.Symbol){}else throw new Error("expecting symbol")
}
//////////////////////////////////////////////////////////////////////////////
//Lexical Environment
class LEXEnv{
  //Create and initialize
  //a new env with these symbols,
  //and optionally a parent env
  constructor(parent, vars=[], vals=[]){
    this.data = new Map();
    this.par = null;
    if(parent)
      this.par = parent;
    for(let ev,e,i=0; i<vars.length; ++i){
      e= vars[i], ev= e.value;
      if(ev == "&"){
        this.data.set(`${vars[i+1]}`, vals.slice(i));
        break;
      }
      if(ev.startsWith("&")){
        this.data.set(ev.slice(1), vals.slice(i));
        break;
      }
      this.data.set(ev, vals[i])
    }
  }
  //Find the env
  //containing this symbol
  find(k){
    _expect(k);
    if(this.data.has(k.value))
      return this;
    else if(this.par)
      return this.par.find(k);
  }
  //Bind this symbol,
  //value to this env
  set(k, v){
    _expect(k);
    this.data.set(k.value, v);
    return v;
  }
  //Get value of
  //this symbol
  get(k){
    _expect(k);
    let env = this.find(k);
    return env ? env.data.get(k.value) : k.value;
  }
  //Print set of vars
  prn(){
    return std.prn(this.data)
  }
  select(what){
    return std.seq(this.data).reduce(function(acc, [k,v]){
      let c6=true;
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
      return acc;
    }, new Map())
  }
}
const _STAR_vars_STAR = new Map();
const _STAR_libs_STAR = new Map();
//////////////////////////////////////////////////////////////////////////////
function getLib(alias){
  return _STAR_libs_STAR.get(alias)
}
//////////////////////////////////////////////////////////////////////////////
function getLibKeys(){
  return Array.from(_STAR_libs_STAR.keys())
}
//////////////////////////////////////////////////////////////////////////////
function addVar(sym, info){
  let s = `${sym}`,
      m = _STAR_vars_STAR.get(s);
  if(m)
    throw new Error(`var: ${s} already added`);
  _STAR_vars_STAR.set(s, info);
}
//////////////////////////////////////////////////////////////////////////////
function getVar(sym){
  return _STAR_vars_STAR.get(`${sym}`)
}
//////////////////////////////////////////////////////////////////////////////
function getVarKeys(){
  return Array.from(_STAR_vars_STAR.keys())
}
//////////////////////////////////////////////////////////////////////////////
function hasVar_QMRK(sym){
  return _STAR_vars_STAR.has(`${sym}`)
}
//////////////////////////////////////////////////////////////////////////////
function addLib(alias, lib){
  //console.log(`adding lib ${alias}`);
  if(_STAR_libs_STAR.has(alias))
    throw new Error(`Library alias already added: ${alias}`);
  _STAR_libs_STAR.set(alias, lib);
}
//////////////////////////////////////////////////////////////////////////////
Function.prototype.clone=function(){
  let orig = this;
  function cloned(...args){
    return orig.apply(this, args)
  }
  function GS__8(v, k){
    cloned[k] = v
  }
  if(std.object_QMRK(orig)){
    Object.keys(orig).forEach(p=> GS__8(orig[p], p))
  }else{
    orig.forEach(GS__8)
  }
  return cloned;
}
//////////////////////////////////////////////////////////////////////////////
function prnStr(...xs){
  return xs.map(a=> std.prn(a)).join(" ")
}
//////////////////////////////////////////////////////////////////////////////
function prnLn(...xs){
  return xs.map(a=> std.prn(a)).forEach(a=> println(a))
}
//////////////////////////////////////////////////////////////////////////////
function slurp(f){
  return fs.readFileSync(f, "utf-8")
}
//////////////////////////////////////////////////////////////////////////////
function spit(f, s){
  fs.writeFileSync(f, s, "utf-8")
}
//////////////////////////////////////////////////////////////////////////////
function clone(obj){
  let rc,oid = typeid(obj);
  switch(oid){
    case "vector":
    case "map":
    case "list":
      rc = std.into_BANG(oid, obj.slice());
      break;
    case "array":
      rc = obj.slice();
      break;
    case "object":
      rc = std.seq(obj).reduce(function(acc, GS__11){
        let [k,v] = GS__11;
        acc[k] = v;
        return acc;
      }, {});
      break;
    case "function":
      rc = obj.clone();
      break;
    default:
      throw new Error(`clone of non-collection: ${oid}`)
  }
  return rc
}
//////////////////////////////////////////////////////////////////////////////
function cons(a, b){
  let r=std.list(a);
  b.forEach(z=>r.push(z));
  return r;
}
//////////////////////////////////////////////////////////////////////////////
function conj(arr,...xs){
  return std.conj(arr,...xs)
}
//////////////////////////////////////////////////////////////////////////////
function fapply(f,...xs){
  return f.apply(this, xs)
}
//////////////////////////////////////////////////////////////////////////////
function fmap(f, arr){
  let out=std.list(),
      m=Array.isArray(arr) ? arr.map(f) : null;
  return m ? std.into(out,m) : out;
}
//////////////////////////////////////////////////////////////////////////////
function resolveJS(s){
  return [s.includes(".") ? eval(/^(.*)\.[^\.]*$/g.exec(s)[1]) : GLOBAL, eval(s)]
}
//////////////////////////////////////////////////////////////////////////////
function filterJS(obj){
  let s = std.stringify(obj);
  if(std.not_DASH_empty(s)) return JSON.parse(s)
}
//////////////////////////////////////////////////////////////////////////////
function withMeta(obj, m){
  obj= clone(obj);
  obj["____meta"] = m;
  return obj;
}
////////////////////////////////////////////////////////////////////////////////
function meta(obj){
  if(std.simple_QMRK(obj))
    throw new Error(`can't get meta from: ${typeid(obj)}`);
  return obj["____meta"];
}
//////////////////////////////////////////////////////////////////////////////
function evalJS(s){
  return filterJS(eval(s.toString()))
}
//////////////////////////////////////////////////////////////////////////////
function invokeJS(method,...xs){
  let [obj,f] = resolveJS(method);
  return filterJS(f.apply(obj, xs));
}
//////////////////////////////////////////////////////////////////////////////
const _STAR_intrinsics_STAR = new Map([
  ["macroexpand*", function(a,b){
    return println(std.prn(expand_QMRK__QMRK(a, b || g_env)))
  }],

  ["macros*", function(fout){
    let s = std.prn(CACHE);
    return fout ? spit(fout, s) : println(s);
  }],

  ["env*", function(what,env,fout){
    let s = std.prn((env || g_env).select(what));
    return fout ? spit(fout, s) : println(s);
  }],

  ["is-same?", function(a,b){
    return a==b
  }],

  ["is-nil?", function(a){
    return a===null
  }],

  ["obj-type*", std.typeid],
  ["gensym*", std.gensym],
  ["is-eq?", std.eq_QMRK],
  ["is-some?", std.some_QMRK],

  ["str*", function(...xs){
    return xs.join("")
  }],

  ["slice*", function(arr,...xs){
    return arr.slice(...xs)
  }],

  ["throw*", function(...xs){
    throw new Error(xs.join(""))
  }],

  ["#f?", function(a){
    return a === false
  }],

  ["#t?", function(a){
    return a === true
  }],

  ["is-str?", function(a){
    return typeof(a) == "string"
  }],

  ["is-keyword?", std.keyword_QMRK],
  ["is-symbol?", std.symbol_QMRK],
  ["keyword*", std.keyword],
  ["symbol*", std.symbol],
  ["println*", prnLn],
  ["prn*", prnStr],
  ["slurp*", slurp],
  ["spit*", spit],

  ["<", function(a,b){
    return a<b
  }],

  ["<=", function(a,b){
    return a <= b
  }],

  [">", function(a,b){
    return a > b
  }],

  [">=", function(a,b){
    return a  >= b
  }],

  ["/", function(A,...xs){
    return xs.reduce(function(a,b){
      return a / b
    }, A)
  }],

  ["+", function(...xs){
    return xs.reduce(function(a,b){
      return a + b
    }, 0)
  }],

  ["-", function(A,...xs){
    return xs.reduce(function(a,b){
      return a - b
    }, A)
  }],

  ["*", function(...xs){
    return xs.reduce(function(a,b){
      return a * b
    }, 1)
  }],

  ["not=", function(a,b){
    return a !== b
  }],

  ["=", function(a,b){
    return a === b
  }],

  ["is-contains?", std.contains_QMRK],
  ["is-vector?", std.vector_QMRK],
  ["is-list?", std.list_QMRK],
  ["is-map?", std.map_QMRK],

  ["is-array?", function(a){
    return Array.isArray(a)
  }],

  ["object*", std.object],
  ["vector*", std.vector],
  ["list*", std.list],

  ["hashmap*", function(...xs){
    return std.assoc_BANG(new Map(),...xs)
  }],

  ["hashset*", function(...xs){
    return std.conj_BANG(new Set(),...xs)
  }],

  ["values*", function(a){
    return std.into(std.list(),Array.from(a.values()))
  }],

  ["keys*", function(a){
    return std.into(std.list(),Array.from(a.keys()))
  }],

  ["get*", function(a,b){
    return std.getProp(a,b)
  }],

  ["not*", function(a){
    return a ? false : true
  }],

  ["dec*", function(a){
    return a - 1
  }],

  ["inc*", function(a){
    return a + 1
  }],

  ["is-even?", function(a){
    return 0 === std.mod(a, 2)
  }],

  ["is-odd?", function(a){
    return 1 === std.mod(a, 2)
  }],

  ["is-sequential?", std.sequential_QMRK],
  ["concat*", std.concat],
  ["count*", std.count],
  ["cons*", std.cons],

  ["rest*", function(a){
    return a ? a.slice(1) : []
  }],

  ["nth*", function(a,b){
    return std.getProp(a,b)
  }],

  ["first*", function(a){
    return std.getProp(a, 0)
  }],

  ["is-empty?", function(a){
    return 0 === std.count(a)
  }],

  ["not-empty*", std.not_DASH_empty],
  ["apply*", fapply],
  ["map*", fmap],
  ["evens*", std.evens],
  ["odds*", std.odds],
  ["meta*", meta],
  ["conj*", std.conj],
  ["seq*", std.seq],
  ["is-atom?", std.atom_QMRK],
  ["atom*", std.atom],
  ["deref*", std.deref],
  ["reset*", std.reset_BANG],
  ["swap*", std.swap_BANG],
  ["with-meta*", withMeta],
  ["js-eval*", evalJS],
  ["js*", invokeJS],

  ["type*", function(a){
    return typeof(a)
  }]
]);
const CACHE = new Map();
//////////////////////////////////////////////////////////////////////////////
//Register a new macro
function setMacro(cmd, func){
  if(cmd && typeof(func) == "function"){
    cmd = `${cmd}`;
    if(!cmd.includes("/")){
      let c = std.peek_DASH_nsp();
      if(!c)
        throw new Error("no namespace");
      cmd = `${std.getProp(c, "id")}/${cmd}`;
    }
    //console.log(`added macro: ${cmd}`);
    CACHE.set(cmd, func);
  }
}
//////////////////////////////////////////////////////////////////////////////
//Get macro
function getMacro(cmd){
  let nsp,skip,mname;
  cmd = `${cmd}`;
  if(cmd.includes("/")){
    let [p,c] = cmd.split("/");
    let tmp, libObj = getLib(p);
    mname = c;
    if(p == KBSTDLR){
      nsp = KBSTDLIB
    }else if(std.nichts_QMRK(libObj) ||
             !std.getProp(libObj, EXPKEY)){
      skip = true
    }else{
      nsp = std.getProp(std.getProp(libObj, EXPKEY), "ns")
    }
  }else{
    let m = getVar(cmd);
    mname = cmd;
    nsp = m ? std.getProp(m, "ns") : null;
  }
  if(!skip){
    if(nsp === null &&
       std.getProp(CACHE, `${KBSTDLIB}/${mname}`)){
      nsp = KBSTDLIB
    }
    if(typeof(nsp) == "string")
      return std.getProp(CACHE, `${nsp}/${mname}`);
  }
}
//////////////////////////////////////////////////////////////////////////////
function dbg(x){
  println("DBG: ", std.prn(x))
}
//////////////////////////////////////////////////////////////////////////////
function readAST(s){
  let ret = rdr.parse(s);
  if(Array.isArray(ret) && 1 === ret.length){
    //TODO: do this or not?
    ret = ret[0]
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function backtick(ast){
  let rc,lstQ=(a)=>typeof(a)!="string" && std.sequential_QMRK(a) && std.not_DASH_empty(a);
  if(!lstQ(ast)){
    rc=[std.symbol("quote"), ast]
  }else if(std.symbol_QMRK(ast[0]) && ast[0] == "unquote"){
    rc=ast[1]
  }else if(lstQ(ast[0]) &&
           std.symbol_QMRK(ast[0][0]) &&
           ast[0][0] == "splice-unquote"){
    rc=[std.symbol("concat*"), ast[0][1], backtick(ast.slice(1))]
  }else{
    rc=[std.symbol("cons*"), backtick(ast[0]), backtick(ast.slice(1))]
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function isMacroCall(ast, env){
  return std.pairs_QMRK(ast) &&
         std.symbol_QMRK(ast[0]) && getMacro(`${ast[0]}`)
}
//////////////////////////////////////////////////////////////////////////////
function expand_QMRK__QMRK(ast,env,mcObj){
  let mac,cmd;
  for(; mcObj || isMacroCall(ast, env);){
    cmd = `${ast[0]}`;
    mac = mcObj || getMacro(cmd);
    mcObj = null;
    //if(mac) console.log("found macro!!!!!"); else console.log("missing macro!!!!");
    ast = mac.apply(this, ast.slice(1));
  }
  return ast;
}
//////////////////////////////////////////////////////////////////////////////
function eval_STAR(ast, env){
  let rc;
  if(typeof(ast)== "number" || ast===true || ast===false || ast===null){
    rc=ast;
  }else if(typeof(ast) == "string"){
    rc=std.unquote_DASH_str(ast)
  }else if(std.keyword_QMRK(ast)){
    rc=`${ast}`
  }else if(std.symbol_QMRK(ast)){
    rc=env.get(ast)
  }else if(false && ast instanceof std.SList){
    rc=std.into(std.list(), ast.map(a=> compute(a, env)))
  }else if(ast instanceof std.SVec){
    rc=std.into(std.vector(), ast.map(a=> compute(a, env)))
  }else if(ast instanceof std.SMap){
    rc = std.hash_DASH_map();
    for(let i=0;i< ast.length; i += 2){
      rc.set(compute(ast[i], env), compute(ast[i+1], env));
    }
  }else if(ast instanceof std.SSet){
    rc = std.hash_DASH_set();
    for(let i = 0;i<ast.length; ++i){
      std.conj_BANG(rc, compute(ast[i], env));
    }
  }else if(ast instanceof Map){
    rc = std.hash_DASH_map();
    ast.forEach((v,k)=>{
      rc.set(compute(k,env),compute(v,env));
    });
  }else if(ast instanceof Set){
    rc = std.hash_DASH_set();
    ast.forEach(v=> rc.add(compute(v,env)));
  }else if(std.pairs_QMRK(ast)){
    rc=new std.SList();
    ast.map(a=> compute(a, env)).forEach(z=>rc.push(z));
  }else {
    throw Error("eval* failed: " + std.prn(ast,true));
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function doAND(ast, env){
  let ret = true;
  for(let i= 1;i<ast.length; ++i){
    ret = compute(ast[i], env);
    if(!ret){break}
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function doOR(ast, env){
  let ret = null;
  for(let i = 1;i<ast.length; ++i){
    ret = compute(ast[i], env);
    if(ret){break}
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function doLET(ast, env){
  let binds = ast[1],
      e = new LEXEnv(env);
  for(let i = 0;i<binds.length; i += 2){
    e.set(binds[i], compute(binds[i+1], e));
  }
  return [ast[2], e];
}
//////////////////////////////////////////////////////////////////////////////
function doMACRO(ast, env){
  let nsp = std.peek_DASH_nsp();
  let name= `${ast[1]}`;
  nsp = nsp ? std.getProp(nsp, "id") : KBSTDLIB;
  if(!name.includes(name, "/")){
    name= `${nsp}/${name}`;
  }
  setMacro(name, fn_DASH__GT_raw(ast[2], ast[3], env));
}
//////////////////////////////////////////////////////////////////////////////
function doTRY(ast, env){
  let a3 = ast[2];
  try{
    return compute(ast[1], env)
  }catch(e){
    if(a3 && "catch*" == a3[0]){
      if(e instanceof Error){ e = e.message }
      return compute(a3[2], new LEXEnv(env, [a3[1]], [e]));
    }
    throw e;
  }
}
//////////////////////////////////////////////////////////////////////////////
function doIF(ast, env){
  let kond = compute(ast[1], env);
  let a3 = ast[3];
  return !std.falsy_QMRK(kond) ? ast[2] : typeof(a3) != "undefined"? a3 : null
}
////////////////////////////////////////////////////////////////////////////////
function form_STAR(ast, env){
  let rc,el = eval_STAR(ast, env);
  if(std.vector_QMRK(el) ||
     std.set_QMRK(el) ||
     std.map_QMRK(el) ||
     std.list_QMRK(el)){
  }else if(Array.isArray(el)){
    let c,f = el[0];
    if(typeof(f) == "function"){
      c= f.____code
    }
    if(Array.isArray(c)){
      rc=[c[1], new LEXEnv(c[2], c[0], el.slice(1))]
    }else if(typeof(f) == "function"){
      rc=std.atom(f.apply(this, el.slice(1)))
    }
  }else if(std.object_QMRK(el)){
    throw Error("form* object!")
  }
  return rc ? rc : std.atom(el);
}
//////////////////////////////////////////////////////////////////////////////
//Wrap the function body and args inside a native js function
function fn_DASH__GT_raw(fargs, fbody, env){
  return function(...args){
    return compute(fbody, new LEXEnv(env, fargs, args))
  }
}
function dbgMacros(){

}
//////////////////////////////////////////////////////////////////////////////
const _STAR_spec_DASH_forms_STAR = new Map([
  ["def*", function(a, e){
    return std.atom(e.set(a[1], compute(a[2], e)))
  }],

  ["and*", function(a,b){
    return std.atom(doAND(a,b))
  }],

  ["or*", function(a,b){
    return std.atom(doOR(a,b))
  }],

  ["let*", function(a,b){
    return doLET(a,b)
  }],

  ["quote", function(a){
    return std.atom(a[1])
  }],

  ["syntax-quote", function(a,b){
    return [backtick(a[1]), b]
  }],

  ["macro*", function(a,b){
    return std.atom(doMACRO(a,b))
  }],

  ["try*", function(a,b){
    return std.atom(doTRY(a,b))
  }],

  ["do*", function(a, e){
    eval_STAR(a.slice(1, -1), e);
    return [a[a.length-1], e];
  }],

  ["if*", function(a,b){
    return [doIF(a,b), b]
  }],

  ["lambda*", function(a,b){
    //a[1] == args
    //a[2] == body
    //b == env
    return std.atom(fn_DASH__GT_raw(a[1], a[2], b))
  }]
]);
//////////////////////////////////////////////////////////////////////////////
//Interpret a expression
function compute(expr, cenv){
  function g1(a){ return std.pairs_QMRK(a) ? a[0] : "" }
  let _r_, _x_, recur, env = cenv || g_env;
  function _f_(ast){
    let res,
        cmd = `${g1(ast)}`,
        fc = _STAR_spec_DASH_forms_STAR.get(cmd);

    if(!std.pairs_QMRK(ast)){
      //atom
      res=std.atom(eval_STAR(ast, env))
    }else if(0 === ast.length){
      //empty
      res=std.atom(ast)
    }else if(typeof(fc) == "function"){
      //special form
      res=fc(ast, env)
    }else{
      //form
      res=form_STAR(ast, env)
    }

    if(!std.atom_QMRK(res)){
      env = res[1];
      res= recur(expand_QMRK__QMRK(res[0], env));
    }

    return res;
  }
  _r_ = _f_;
  recur=function(){
    _x_ = arguments;
    if(_r_){
      for(_r_ = undefined; _r_ === undefined;){
        _r_ = _f_.apply(this, _x_)
      }
      return _r_;
    }
  };
  let ret= recur(expand_QMRK__QMRK(expr, env));
  return typeof(ret.value) == "undefined" ? null : ret.value;
}
//////////////////////////////////////////////////////////////////////////////
//Create a new interpreter environment
function newEnv(){
  let ret = new LEXEnv(),
      GS__21 = _STAR_intrinsics_STAR;
  GS__21.forEach((v,k)=> ret.set(std.symbol(k), v));
  return ret;
}
////////////////////////////////////////////////////////////////////////////////
//Start a interactive session
function runRepl(){
  let ss = readline.createInterface(process.stdin, process.stdout);
  let z = prefix.length;
  function pt(){
    ss.setPrompt(prefix, z);
    return ss.prompt();
  }
  function rl(line){
    try{
      if(line)
        println(reval(line))
    }catch(e){
      println(e)
    }
    return pt();
  }
  function cl(){
    println("Bye!");
    return process.exit(0);
  }
  ss.on("close", cl);
  ss.on("line", rl);
  init();
  println(prefix, "Kirby REPL v", _STAR_version_STAR);
  return pt();
}
//////////////////////////////////////////////////////////////////////////////
//Eval one or more expressions
function reval(expr,...xs){
  function f(a){
    let R__25 = readAST(a);
    let R__27 = compute(R__25);
    let R__29 = std.prn(R__27,true);
    return R__29;
  }
  let ret = f(expr);
  xs.forEach(a=>{ ret = f(a) });
  return ret;
}
var _STAR_version_STAR = "";
var inited_QMRK = false;
var g_env = null;
//////////////////////////////////////////////////////////////////////////////
//Set up the runtime environment
function init(ver){
  if(!inited_QMRK){
    let lib={};
    lib[EXPKEY]={
      ns: "user", vars: [], macros: {}
    };
    _STAR_version_STAR = ver;
    g_env = newEnv();
    addLib(std.peek_DASH_nsp().get("id"),lib);
    inited_QMRK = true;
  }
  return inited_QMRK;
}
//////////////////////////////////////////////////////////////////////////////
//Returns the runtime environment
function genv(){
  return g_env
}
//////////////////////////////////////////////////////////////////////////////
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.engine",
    vars: ["EXPKEY", "KBSTDLR", "KBPFX", "KBSTDLIB", "LEXEnv", "getLib", "getLibKeys", "addVar", "getVar", "getVarKeys", "hasVar?", "addLib", "slurp", "spit", "setMacro", "getMacro", "readAST", "expand??", "compute", "newEnv", "runRepl", "init", "genv"],
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
  getVarKeys: getVarKeys,
  hasVar_QMRK: hasVar_QMRK,
  addLib: addLib,
  slurp: slurp,
  spit: spit,
  setMacro: setMacro,
  getMacro: getMacro,
  readAST: readAST,
  expand_QMRK__QMRK: expand_QMRK__QMRK,
  compute: compute,
  newEnv: newEnv,
  runRepl: runRepl,
  init: init,
  genv: genv
};

//////////////////////////////////////////////////////////////////////////////
//EOF

