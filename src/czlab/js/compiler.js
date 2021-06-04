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
const smap = require("source-map");
const std = require("./stdlib");
const rt = require("./engine");
const KBSTDLR = rt["KBSTDLR"];
const KBSTDLIB = rt["KBSTDLIB"];
const KBPFX = rt["KBPFX"];
const EXPKEY = rt["EXPKEY"];
const reader = require("./reader");
const fs = require("fs");
const path = require("path");
const esfmt = require("esformatter");
const __module_namespace__ = "czlab.kirby.compiler";

const ERRORS_DASH_MAP = new Map([["no-sourcemap-info", "Expected source map info"],
  ["invalid-fargs", "Invalid function args"],
  ["invalid-catch", "Invalid catch clause"],
  ["invalid-try", "Invalid try clause"],
  ["invalid-require", "Invalid require clause"],
  ["invalid-namespace", "Invalid namespace clause"],
  ["destruct-args", "Bad destructure args"],
  ["outside-macro", "Invalid clause outside of macro"],
  ["file-access", "Failed file access"],
  ["file-read", "Failed file read"],
  ["file-open", "Failed to open file"],
  ["unknown-keyword", "Unknown keyword"],
  ["invalid-arity", "Invalid function arity"],
  ["invalid-meta", "Invalid meta data"],
  ["syntax-error", "Syntax error"],
  ["empty-form", "Invalid form (empty)"]]);
const ARRSLICE = "Array.prototype.slice.call";
const JSARGS = "arguments";
const LARGS = "____args";
const BREAK = "____break";
const MOD_DASH_VER = "1.0.0";
const GET_DASH_INDEX = `${KBSTDLR}.getIndex`;
const GET_DASH_PROP = `${KBSTDLR}.getProp`;
const KEYW = `${KBSTDLR}.keyword`;
const SYMB = `${KBSTDLR}.symbol`;
const COUNT = `${KBSTDLR}.count`;
const MODLO = `${KBSTDLR}.modulo`;
var _STAR_externs_STAR = undefined;
var _STAR_macros_STAR = undefined;
var _STAR_vars_STAR = undefined;
var _STAR_last_DASH_line_STAR = 0;
var _STAR_last_DASH_col_STAR = 0;
var SPEC_DASH_OPS = {};
var MATH_DASH_OP_DASH_REGEX = /^[-+][0-9]+$/;
//////////////////////////////////////////////////////////////////////////////
//Ensure name is compliant
function unmangle(s){
  return (s.split(".") || []).map(a=> reader.jsid(a)).join(".")
}
//////////////////////////////////////////////////////////////////////////////
function tnodeEx(name,chunk){
  return tnode(null, null, null, chunk, name)
}
//////////////////////////////////////////////////////////////////////////////
function tnode(...args){
  let [src,ln,col,chunk,name] = args;
  return new smap.SourceNode(opt_QMRK__QMRK(ln, null),
                             opt_QMRK__QMRK(col, null),
                             opt_QMRK__QMRK(src, null),
                             opt_QMRK__QMRK(chunk, null),
                             opt_QMRK__QMRK(name, null))
}
//////////////////////////////////////////////////////////////////////////////
//Deal with possible destructuring
//of args in function definition
function doFuncArgs(args, env){
  let fargs = mk_node(args);
  let fdefs = mk_node(args);
  let ret = [fargs, fdefs];
  let rval,out,pms = [];
  for(let e,i=0,end=std.count(args); i<end; ++i){
    e=args[i];
    rval = mk_node(args);
    out = mk_node(args);
    if(std.symbol_QMRK(e)){
      if(e == "&"){
        e = args[i+1]
        rval.add([ARRSLICE, "(", JSARGS, ",", [i].join(""), ")"]);
        fdefs.add(["let ", tx_STAR(std.symbol_QMRK(e) ? e : dstru_STAR(e, out, env),env),"=", rval, ";\n", out]);
        break;
      }else{
        pms.push(e == "_" ? xfi(e, std.gensym("U__")) : e)
      }
    }else if(Array.isArray(e)){
      rval.add([JSARGS, "[", [i].join(""), "]"]);
      pms.push(dstru_STAR(e, out, env));
      fdefs.add(out);
    }else{
      error_BANG("destruct-args", args)
    }
  }
  pms.forEach(a=> fargs.add(tx_STAR(a, env)));
  fargs.join(",");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Decide on what the
//rhs should be referred to 'as'
function dstru_STAR(coll, out, env){
  let rhs = gensym();
  for(let e,i=0,end=std.count(coll); i<end; ++i){
    e = coll[i];
    if(std.keyword_QMRK(e) && e == "as"){
      rhs = std.symbol([coll[i+1]].join(""));
      break;
    }
  }
  xfi(coll, rhs);
  out.add(std.map_QMRK(coll) ? dmap_BANG(rhs,coll,env) : std.vector_QMRK(coll) ? dvec_BANG(rhs,coll,env) : "");
  return rhs;
}
//////////////////////////////////////////////////////////////////////////////
//Destruct a vec
function dvec_BANG(src, coll, env){
  let rval,out,ret = mk_node(coll);
  let as = tx_STAR(src, env);
  for(let e,i=0,end=std.count(coll); i<end; ++i){
    e = coll[i];
    rval = mk_node(coll);
    out = mk_node(coll);
    if(std.symbol_QMRK(e)){
      if(e == "&"){
        e = coll[i+1];
        rval.add([ARRSLICE, "(", as, ",", [i].join(""), ")"]);
        ret.add(["let ", tx_STAR(!std.symbol_QMRK(e) ? dstru_STAR(e,out,env) : e, env), "=", rval, ";\n", out]);
        break;
      }else if(e != "_"){
        ret.add(["let ", tx_STAR(e, env), "=", slib_BANG(GET_DASH_INDEX), "(", as, ",", [i].join(""), ");\n"]);
      }
    }else if(Array.isArray(e)){
      rval.add([as, "[", [i].join(""), "]"]);
      ret.add(["let ", tx_STAR(dstru_STAR(e, out, env), env), "=", rval, ";\n", out]);
    }else if(std.keyword_QMRK(e)){
      if(e == "as"){ ++i }else{
        error_BANG("unknown-keyword", coll)
      }
    }else{
      error_BANG("syntax-error", coll)
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Destruct a map
function dmap_BANG(src, coll, env){
  let arr,ret = mk_node(coll);
  let as = tx_STAR(src, env);
  for(let e,i=0,end=std.count(coll); i<end; i += 2){
    e = coll[i];
    if(std.keyword_QMRK(e)){
      if(e == "keys" || e == "strs"){
        for(let a,i=0, c2=coll[i+1],sz=std.count(c2); i<sz; ++i){
          a= c2[i];
          ret.add(["let ", tx_STAR(a, env), "=", slib_BANG(GET_DASH_PROP), "(", as, ",", std.quote_DASH_str([a].join("")), ");\n"]);
        }
      }else if(e == "as"){
      }else{
        error_BANG("unknown-keyword", coll)
      }
    }else{
      error_BANG("syntax-error", coll)
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Nothing complex
function simple_QMRK(ast){
  return typeof(ast) == "undefined" || ast === null || typeof(ast)== "string" || typeof(ast) == "number" || typeof(ast) == "boolean"
}
//////////////////////////////////////////////////////////////////////////////
function wrap(ret, head, tail){
  if(ret){
    if(head)
      ret.prepend(head);
    if(tail)
      ret.add(tail);
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Flag the AST if it is an expression
function exprHint(ast, flag){
  let GS__13 = std.simple_QMRK(ast) ? std.primitive(ast) : ast;
  GS__13["____expr"] = flag;
  return GS__13;
}
//////////////////////////////////////////////////////////////////////////////
function stmt_QMRK(ast){
  if(std.simple_QMRK(ast)) error_BANG("syntax-error", ast);
  return ast.____expr === false;
}
//////////////////////////////////////////////////////////////////////////////
function error_BANG(e,ast,msg){
  throw new Error([std.getProp(ERRORS_DASH_MAP, e),
                   (msg ? ` : ${msg}` : null),
                   (ast && typeof(ast.line) == "number") ? `\nline: ${ast.line}` : null,
                   (ast && typeof(ast.source) == "string") ? `\nfile: ${ast.source}` : null].join(""))
}
//////////////////////////////////////////////////////////////////////////////
//Test a regex
function testre_QMRK(re, x){
  return x ? re.test(x) : false
}
//////////////////////////////////////////////////////////////////////////////
function fn_QMRK__QMRK(cmd){
  return testre_QMRK(reader.REGEX.func, cmd) ? `(${cmd})` : cmd
}
//////////////////////////////////////////////////////////////////////////////
function pad(n){
  return " ".repeat(n)
}
//////////////////////////////////////////////////////////////////////////////
function mk_node(ast,obj){
  let GS__16 = opt_QMRK__QMRK(obj, tnode());
  GS__16["source"] = ast.source;
  GS__16["line"] = ast.line;
  GS__16["column"] = ast.column;
  return GS__16;
}
//////////////////////////////////////////////////////////////////////////////
//Process a file unit.  Sort out all the macros first then others.
//Also, always check first for (ns ...)
function txTree(root, env){
  let ms = [];
  let os = [];
  let n1 = root[0];
  let ret = mk_node(root);
  if("ns" != n1[0])
    throw new Error("(ns ...) must be first form in file")
  ms.push(n1);
  for(let t,i=0,GS__18=root.slice(1),sz = std.count(GS__18); i<sz; ++i){
    t = GS__18[i];
    std.conj_BANG(Array.isArray(t) && std.symbol_QMRK(t[0]) && "defmacro" == t[0] ? ms : os, t)
  }
  ms.concat(os).forEach(function(r){
    _STAR_last_DASH_line_STAR = r.line;
    _STAR_last_DASH_col_STAR = r.col;
    let t = tx_STAR(r, env);
    return typeof(t) == "undefined" || t === null ? null : ret.add([t, ";\n"])
  });
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//fn: [txForm] in file: compiler.ky, line: 247
function txForm(expr, env){
  if(Array.isArray(expr)){
    expr.forEach((a,b,c)=>{
      return (c[b] = tx_STAR(a, env)) })
  }
  return expr;
}
//////////////////////////////////////////////////////////////////////////////
function txAtom(a){
  let rc,s = [a].join("");
  if(std.lambdaArg_QMRK(a)){
    rc=`${LARGS}[${parseInt(s.slice(1)) - 1}]`
  }else if(std.regexObj_QMRK(a)){
    rc=mk_node(a, tnodeEx(s, s.slice(1)))
  }else if(std.keyword_QMRK(a)){
    rc=mk_node(a, tnodeEx(s, std.quote_DASH_str(s)))
  }else if(std.symbol_QMRK(a)){
    rc=mk_node(a, tnodeEx(s, unmangle(s)))
  }else if(a===null){
    rc="null"
  }else if (std.primitive_QMRK(a)){
    a = a.value;
    s = [a].join("");
    rc=typeof(a) == "string" ?
                  std.quote_DASH_str(a) : a === null ? "null" : s;
  }else if(typeof(a) == "string"){
    rc= std.quote_DASH_str(a)
  }else{
    rc=reader.jsid(s)
  }
  return rc
}
//////////////////////////////////////////////////////////////////////////////
function tx_STAR(x,env){
  return Array.isArray(x) ? txPairs(x, env) : txAtom(x)
}
//////////////////////////////////////////////////////////////////////////////
function gcmd(ast){
  if(std.map_QMRK(ast)){
    rc="hash-map"
  }else if(std.obj_QMRK(ast)){
    rc="object"
  }else if(std.vector_QMRK(ast)){
    rc="vec"
  }else if(std.set_QMRK(ast)){
    rc="hash-set"
  }else if(std.list_QMRK(ast)){
    rc="list"
  }else{
    rc=Array.isArray(ast) && !Array.isArray(ast[0]) ? [ast[0]].join("") : "";
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function quoteSingle(a){
  let rc;
  if(std.keyword_QMRK(a)){
    rc=[slib_BANG(KEYW), "(\"", a.value, "\")"].join("")
  }else if(std.symbol_QMRK(a)){
    rc=[slib_BANG(SYMB), "(\"", a.value, "\")"].join("")
  }else if(std.primitive_QMRK(a)){
    a = a.value;
    rc=typeof(a) == "string" ?
            std.quote_DASH_str(a) : a === null ? "null" : [a].join("")
  }else if(typeof(a) == "string"){
    rc=std.quote_DASH_str(a)
  }else{
    rc=[a].join("")
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function quote_BANG(ast, env){
  return Array.isArray(ast) ?
    (std.map_QMRK(ast) ? quoteMap(ast, env) : quoteBlock(ast, env)) : quoteSingle(ast)
}
//////////////////////////////////////////////////////////////////////////////
function quoteMap(ast, env){
  let cma = "";
  let ret = mk_node(ast);
  for(let a,i=0,end=std.count(ast); i<end; i += 2){
    a= ast[i];
    if(i>0)
      ret.add(",");
    ret.add([quote_BANG(a, env), " , ", quote_BANG(ast[i + 1], env)]);
  }
  if(std.count(ast) !== 0){
    cma = ","
  }
  return wrap(ret, ["[", slib_BANG(SYMB), "(\"hash-map\")", cma], "]")
}
//////////////////////////////////////////////////////////////////////////////
function quoteBlock(ast, env){
  let ret = mk_node(ast);
  for(let a,i=0,end=std.count(ast); i<end; ++i){
    a = ast[i];
    if(i>0)
      ret.add(",");
    ret.add(quote_BANG(a, env));
  }
  return wrap(ret, "[", "]");
}
////////////////////////////////////////////////////////////////////////////////
function spreadInfo(from, to){
  if(from && !std.simple_QMRK(from) &&
     typeof(from.line) == "number" && Array.isArray(to)){
    xfi(from, to);
    for(let t,i=0,sz=std.count(to);i<sz; ++i){
      spreadInfo(from, to[i])
    }
  }else{
    xfi(from, to)
  }
}
//////////////////////////////////////////////////////////////////////////////
function txPairs(ast, env){
  let op,tmp,nsp = std.peekNSP();
  let stmtQ = stmt_QMRK(ast);
  let ret = mk_node(ast);
  let cmd = gcmd(ast);
  let e1 = ast[0];
  let orig = ast;
  let mc = rt.getMacro(cmd);
  xfi(e1, ret);
  xfi(e1, ast);
  if(mc){
    ast = rt.expand_QMRK__QMRK(ast, env, mc);
    ast = xfi(orig, exprHint(ast, !stmtQ));
    spreadInfo(orig, ast);
    cmd = gcmd(ast);
  }
  if(reader.REGEX.int.test(cmd)){
    cmd = !(cmd.startsWith("+") || cmd.startsWith("-")) ? ["+", cmd].join("") : cmd;
    ast = xfi(ast, [std.symbol(cmd.charAt(0)), ast[1], parseInt(cmd.slice(1))]);
    cmd = [ast[0]].join("");
  }
  op = std.getProp(SPEC_DASH_OPS, cmd);
  if(cmd == "with-meta"){
    ret.add(tx_STAR(meta_QMRK__QMRK(ast, env)[1], env))
  }else if(cmd.startsWith(".-")){
    ret.add([tx_STAR(ast[1], env), ".", tx_STAR(std.symbol(cmd.slice(2)), env)])
  }else if(cmd.startsWith(".@")){
    ret.add([tx_STAR(ast[1], env), "[",
             cmd.slice(cmd.startsWith(".@+") ? 3 : 2),cmd.startsWith(".@+") ? "+1" : "", "]"])
  }else if(cmd.startsWith(".")){
    let pms = [];
    for(let a,i=0,GS__27 = ast.slice(2),sz= std.count(GS__27); i<sz; ++i){
      pms.push(tx_STAR(GS__27[i], env))
    }
    ret.add([tx_STAR(ast[1], env), tx_STAR(std.symbol(cmd), env)].concat("(", pms.join(",") , ")"));
  }else if(std.some_QMRK(op)) {
    ret = op(ast, env)
  }else if((cmd == "splice-unquote" ||
            cmd == "unquote" ||
            cmd == "syntax-quote") && !std.getProp(nsp, "id").startsWith(KBPFX)){
    error_BANG("outside-macro", ast)
  }else{
    cmd = std.pairs_QMRK(ast) ? [txForm(ast, env)[0]].join("") : tx_STAR(ast, env);
    if(!cmd)
      error_BANG("empty-form", ast);
    cmd = slib_BANG(cmd);
    ret.add(std.pairs_QMRK(ast) ?
                    [fn_QMRK__QMRK(cmd), "(", ast.slice(1).join(","), ")"] : cmd);
  }
  return mk_node(ast, ret);
}
//////////////////////////////////////////////////////////////////////////////
//Convert to jsdoc
function writeDoc(doc){
  return (((doc ? std.split(std.unquote_DASH_str(doc), "\n") : []) || []).map(a=>{
    let s = [a].join("").trim();
    return not_DASH_empty(s) ? `//${s}\n` : null;
  }) || []).filter(a=> not_DASH_empty(a))
}
//////////////////////////////////////////////////////////////////////////////
//A Do block
function txDo(ast, env,ret_Q){
  let e,stmtQ = stmt_QMRK(ast);
  let ret = mk_node(ast);
  let end = ast.length - 1;
  ret_Q = stmtQ ? false : opt_QMRK__QMRK(ret_Q, true);
  for(let a,i=0; i < end; ++i){
    a = ast[i];
    ret.add([tx_STAR(exprHint(a, false), env), ";\n"]);
  }
  if(end >= 0){
    e = tx_STAR(exprHint(ast[end], !stmtQ), env);
    ret.add(!ret_Q ? [e, ";\n"] : ["return ", e, ";\n"]);
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function isMeta_QMRK(obj){
  return Array.isArray(obj) &&
         3 === std.count(obj) &&
         std.symbol_QMRK(obj[0]) &&
         "with-meta" == [obj[0]].join("")
}
//////////////////////////////////////////////////////////////////////////////
function meta_QMRK__QMRK(obj, env){
  let rc;
  if(isMeta_QMRK(obj)){
    let [X,e2,e3]=obj;
    e2["____meta"] = evalMeta(e3, env);
    rc= [e2.____meta, e2];
  }else{
    rc=[null, obj];
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function fmtSpecOps(fname, attrs){
  let out = (std.getProp(attrs, "opcode") || []).map(a=>{
    return [reader.jsid("SPEC-OPS"), "[",
            std.quote_DASH_str(a), "] = ", fname].join("")
  }).join(";\n");
  return std.count(out) > 0 ? [out, ";\n"].join("") : "";
}
//////////////////////////////////////////////////////////////////////////////
function writeFuncPre(pre, env){
  let ret = mk_node(pre);
  let c2 = [std.symbol("if-not"), [std.symbol("and")].concat(pre),
    [std.symbol("throw"), [std.symbol("Error"), "Precondition failed"]]];
  return ret.add([tx_STAR(exprHint(c2, false), env), ";\n"]);
}
//////////////////////////////////////////////////////////////////////////////
function writeFuncInfo(fname, ast){
  let file = ast.source ? ast.source.slice(ast.source.lastIndexOf("/") + 1) : "?";
  let s = ["//fn: [", fname, "] in file: ", file, ", line: ",(ast.line || "?"), "\n"].join("");
  let len = s.length;
  if(len < 80){ len = 80 }
  return ["/".repeat(len), "\n", s].join("");
}
//////////////////////////////////////////////////////////////////////////////
function evalMeta(ast, env){
  return rt.compute(
    Array.isArray(ast) ?
    ast :
    std.keyword_QMRK(ast) ?
      std.into_BANG("map", [ast, true]) :
      std.symbol_QMRK(ast) ?
        std.into_BANG("map", [std.keyword(":tag"), ast]) : error_BANG("invalid-meta", ast) ,env)
}
//////////////////////////////////////////////////////////////////////////////
//Maybe strip out kirbyref
function slib_BANG(cmd){
  let nsp = std.peekNSP();
  let lib = [KBSTDLR, "."].join("");
  cmd = [cmd].join("");
  return cmd.startsWith(lib) &&
         std.getProp(nsp, "id") == KBSTDLIB ? cmd.slice(lib.length) : cmd
}
//////////////////////////////////////////////////////////////////////////////
function assertArity(kond, ast){
  if(!kond)
    error_BANG("invalid-arity", ast);
  return assertInfo(ast);
}
//////////////////////////////////////////////////////////////////////////////
function assertInfo(ast){
  return (false && ast && !std.simple_QMRK(ast) && typeof(ast.line) != "number") ?
    error_BANG("no-sourcemap-info", ast) :
    null;
}
//////////////////////////////////////////////////////////////////////////////
//Load in all the exported macros from the external lib
function loadRLib(info, env){
  let {ns,macros,vars} = info;
  function loop(v, k){
    let ast = rt.readAST(v);
    let s = std.symbol([ns, "/", [ast[1]].join("")].join(""));
    ast[1] = s;
    return rt.compute(ast, env);
  }
  if(std.object_QMRK(macros)){
    Object.keys(macros).forEach(p=> loop(std.getProp(macros, p), p))
  }else{
    macros.forEach(loop)
  }
  return ns;
}
//////////////////////////////////////////////////////////////////////////////
function loadRVars(info, env){
  let vs= std.getProp(info, "vars") || [];
  return [vs.map(a=> std.symbol(a)),
          vs.reduce((x,y)=> std.conj_BANG(x,y), new Set([]))]
}
//////////////////////////////////////////////////////////////////////////////
function isPub_QMRK(ast){
  return !([Array.isArray(ast) ? ast[0] : ast].join("").endsWith("-"))
}
//////////////////////////////////////////////////////////////////////////////
//Takes a set of functions and returns a fn that is the juxtaposition
//of those fns.  The returned fn takes a variable number of args, and
//returns a vector containing the result of applying each fn to the
//args (left-to-right).
//((juxt a b c) x) => [(a x) (b x) (c x)]
function sf_DASH_juxt(ast, env){
  let ret = mk_node(ast);
  for(let f,a,i=0,GS__37 = ast.slice(1),sz=std.count(GS__37); i<sz; ++i){
    a = GS__37[i];
    f = [std.gensym("F__")].join("");
    ret.add(["let ", f, "=", tx_STAR(a, env), ";\n",
             "ret.push(", f, ".apply(this,", LARGS, "));\n"]);
  }
  return wrap(ret, ["function(){\nlet ret=[],", LARGS, "=", ARRSLICE, "(", JSARGS, ");\n"], "return ret;\n}")
}
SPEC_DASH_OPS["juxt"] = sf_DASH_juxt;
//////////////////////////////////////////////////////////////////////////////
//Returns an atom's current state.
function sf_DASH_deref(ast, env){
  assertArity(std.count(ast) === 2, ast);
  return mk_node(ast).add([tx_STAR(ast[1], env), ".value"]);
}
SPEC_DASH_OPS["deref"] = sf_DASH_deref;
////////////////////////////////////////////////////////////////////////////////
//Takes a set of functions and returns a fn that is the composition
//of those fns.  The returned fn takes a variable number of args,
//applies the rightmost of fns to the args, the next
//fn (right-to-left) to the result, etc.
function sf_DASH_compose(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let prev,r,f,ret = mk_node(ast);
  let start = ast.length - 1;
  for(let a,i=start,end = 0; i>end; --i){
    a = ast[i];
    f = [std.gensym("F__")].join("");
    r = [std.gensym("R__")].join("");
    ret.add(["let ", f, "=", tx_STAR(a, env), ";\n", "let ", r, "=", f,((i === start) ?
      [".apply(this,", LARGS].join("") :
      ["(", prev].join("")), ");\n"]);
    prev = r;
  }
  return wrap(ret, ["function () {\nlet ", LARGS, "=", ARRSLICE, "(", JSARGS, ");\n"], ["return ", prev, ";\n", "}"]);
}
SPEC_DASH_OPS["comp"] = sf_DASH_compose;
//////////////////////////////////////////////////////////////////////////////
//Returns the unevaluated form
function sf_DASH_quote(ast, env){
  assertArity(std.count(ast) === 2, ast);
  return wrap(mk_node(ast), null, quote_BANG(ast[1], env));
}
SPEC_DASH_OPS["quote"] = sf_DASH_quote;
//////////////////////////////////////////////////////////////////////////////
//Define a Class
function sf_DASH_deftype(ast, env){
  assertArity(std.count(ast) >= 3, ast);
  let pub_QMRK = isPub_QMRK(ast);
  let par = ast[2][0];
  let ret = mk_node(ast);
  let czn = ast[1];
  let czname = tx_STAR(czn, env);
  let GS__39 = typeof(ast[3]) == "string" ? [ast[3], ast.slice(4)] : [null, ast.slice(3)];
  let [doc,mtds] = GS__39;
  rt.addVar(czn, new Map([["ns", std._STAR_ns_STAR()]]));
  ret.add(["class ", czname,(par ? [" extends ", tx_STAR(par, env)].join("") : ""), " {\n"]);
  for(let m1,mtd,m,i=0, sz=std.count(mtds); i<sz; ++i){
    mtd = std.symbol("method");
    m = mtds[i];
    m1 = m[0];
    xfi(m1, mtd);
    m.unshift(mtd);
    rt.addVar(`${czn}.${m1}`, new Map([["ns", std._STAR_ns_STAR()]]));
    ret.add([sf_DASH_func(m, env, false), "\n"]);
  }
  if(doc)
    ret.prepend(writeDoc(doc));
  if(pub_QMRK){
    _STAR_vars_STAR.push(czn);
    std.assoc_BANG(_STAR_externs_STAR, czname, czname);
  }
  return ret.add("}\n");
}
SPEC_DASH_OPS["deftype"] = sf_DASH_deftype;
SPEC_DASH_OPS["deftype-"] = sf_DASH_deftype;
//////////////////////////////////////////////////////////////////////////////
//Handle comparison operators.
function sf_DASH_compOp(ast, env){
  assertArity(std.count(ast) >= 3 && 0 != std.modulo(std.count(ast), 2), ast);
  let op,ret = mk_node(ast);
  let cmd = [ast[0]].join("");
  if(cmd == "not="){
    ast[0] = std.symbol("!==")
  }else if(cmd == "="){
    ast[0] = std.symbol("===")
  }
  op = [ast[0]].join("");
  for(let a, i = 1, end=ast.length - 1; i<end; ++i){
    a = ast[i];
    if(i !== 1)
      ret.add(" && ");
    ret.add([tx_STAR(a, env), " ", op, " ", tx_STAR(ast[i + 1], env)]);
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS[">"] = sf_DASH_compOp;
SPEC_DASH_OPS[">="] = sf_DASH_compOp;
SPEC_DASH_OPS["<"] = sf_DASH_compOp;
SPEC_DASH_OPS["<="] = sf_DASH_compOp;
SPEC_DASH_OPS["not="] = sf_DASH_compOp;
SPEC_DASH_OPS["!="] = sf_DASH_compOp;
SPEC_DASH_OPS["=="] = sf_DASH_compOp;
SPEC_DASH_OPS["="] = sf_DASH_compOp;
//////////////////////////////////////////////////////////////////////////////
//Handles math operators
function sf_DASH_arithOp(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let ret = mk_node(ast);
  let cmd;
  let e1 = [ast[0]].join("");
  switch(e1){
    case "unsigned-bit-shift-right":
      cmd = ">>>";
      break;
    case "bit-shift-right":
      cmd = ">>";
      break;
    case "bit-shift-left":
      cmd = "<<";
      break;
    case "bit-and":
      cmd = "&";
      break;
    case "bit-or":
      cmd = "|";
      break;
    case "bit-not":
      cmd = "~";
      break;
    case "bit-xor":
      cmd = "^";
      break;
    case "rem":
      cmd = "%";
      break;
    case "div":
      cmd = "/";
      break;
    case "and":
      cmd = "&&";
      break;
    case "or":
      cmd = "||";
      break;
    case "exp":
      cmd = "**";
      break;
    default:
      cmd = e1;
      break;
  }
  if("mod" == cmd){
    ret.add([MODLO, "(", tx_STAR(ast[1], env), ",", tx_STAR(ast[2], env), ")"]);
  }else if("~" == cmd){
    ret.add(["~", tx_STAR(ast[1], env)]);
  }else{
    if("-" == cmd && 2 === std.count(ast)){
      ret.add("-1 * ");
    }
    for(let a,i = 1,end = std.count(ast); i<end; ++i){
      a= ast[i];
      if(std.count(ast) > 2){
        if(i > 1)
          ret.add([" ", cmd, " "].join(""))
      }
      ret.add(tx_STAR(a_QUOT, env))
    }
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS["bit-shift-left"] = sf_DASH_arithOp;
SPEC_DASH_OPS["bit-shift-right"] = sf_DASH_arithOp;
SPEC_DASH_OPS["unsigned-bit-shift-right"] = sf_DASH_arithOp;
SPEC_DASH_OPS["or"] = sf_DASH_arithOp;
SPEC_DASH_OPS["and"] = sf_DASH_arithOp;
SPEC_DASH_OPS["exp"] = sf_DASH_arithOp;
SPEC_DASH_OPS["rem"] = sf_DASH_arithOp;
SPEC_DASH_OPS["+"] = sf_DASH_arithOp;
SPEC_DASH_OPS["-"] = sf_DASH_arithOp;
SPEC_DASH_OPS["*"] = sf_DASH_arithOp;
SPEC_DASH_OPS["/"] = sf_DASH_arithOp;
SPEC_DASH_OPS["div"] = sf_DASH_arithOp;
SPEC_DASH_OPS["mod"] = sf_DASH_arithOp;
SPEC_DASH_OPS["bit-and"] = sf_DASH_arithOp;
SPEC_DASH_OPS["bit-or"] = sf_DASH_arithOp;
SPEC_DASH_OPS["bit-not"] = sf_DASH_arithOp;
SPEC_DASH_OPS["bit-xor"] = sf_DASH_arithOp;
//////////////////////////////////////////////////////////////////////////////
//Evaluates the expressions in order and returns the value of the last. If no
//expressions are supplied, returns nil.
function sf_DASH_do(ast, env){
  let ret = mk_node(ast);
  let stmtQ = stmt_QMRK(ast);
  ret.add(txDo(exprHint(xfi(ast, ast.slice(1)), !stmtQ), env, !stmtQ));
  return (stmtQ ?
    wrap(ret, "if (true) {\n", "\n}\n") :
    wrap(ret, "(function() {\n", "}).call(this)"));
}
SPEC_DASH_OPS["do"] = sf_DASH_do;
////////////////////////////////////////////////////////////////////////////////
//Takes an expression, and a set of clauses.
//Each clause can take the form of either:
//test-constant result-expr
//(test-constant1 ... test-constantN)  result-expr
//The test-constants are not evaluated. They must be compile-time
//literals, and need not be quoted.  If the expression is equal to a
//test-constant, the corresponding result-expr is returned. A single
//default expression can follow the clauses, and its value will be
//returned if no clause matches.
function sf_DASH_case(ast, env){
  assertArity(std.count(ast) >= 4, ast);
  let stmtQ = stmt_QMRK(ast);
  let ret = node_QUOT(ast);
  let tst = ast[1];
  let brk = ";\nbreak;\n";
  let gs = [std.gensym("C__")].join("");
  let dft = std.modulo(std.count(ast), 2) !== 0 ? std.pop_BANG(ast)[0] : null;
  for(let c,a_QUOT,i = 2, sz = std.count(ast); i < sz; i += 2){
    a_QUOT = ast[i];
    c = tx_STAR(ast[i+1], env);
    if(std.pairs_QMRK(a_QUOT)){
      for(let j_QUOT,c2 = a_QUOT, j=0, end = std.count(c2); j<end; ++j){
        j_QUOT = c2[j];
        ret.add(["case ", tx_STAR(j_QUOT, env), ":\n",(j === (a_QUOT.length-1) ?
          [gs, "=", c, brk].join("") :
          "")]);
      }
    }else{
      ret.add(["case ", tx_STAR(a_QUOT, env), ":\n", gs, "=", c, brk])
    }
  }
  if(dft){
    ret.add(["default:\n", gs, "=", tx_STAR(dft, env), brk]);
  }
  wrap(ret, ["switch (", tx_STAR(tst, env), ") {\n"], "}");
  return (stmtQ ?
    wrap(ret, ["let ", gs, ";\n"], "") :
    wrap(ret, ["(function() { let ", gs, ";\n"].join(""), ["return ", gs, ";}).call(this)"].join("")));
}
SPEC_DASH_OPS["case"] = sf_DASH_case;
//////////////////////////////////////////////////////////////////////////////
function sf_DASH_let(ast, env){
  let stmtQ = stmt_QMRK(ast);
  let ret = mk_node(ast);
  let [e1,e2]=ast;
  ast[0] = xfi(e1, std.symbol("do"));
  std.into_BANG(undefined, std.cons_BANG(xfi(e2, std.symbol("vars")), e2));
  return sf_DASH_do(ast, env);
}
SPEC_DASH_OPS["letx"] = sf_DASH_let;
//////////////////////////////////////////////////////////////////////////////
//Creates a variable with an initial value
function sf_DASH_var(ast, env){
  assertArity(std.modulo(std.count(ast), 2) !== 0, ast);
  let ret = mk_node(ast);
  let cmd = [ast[0]].join("");
  let vs = [];
  let keys = new Map([]);
  let pub_QMRK = cmd == "def" || cmd == "const";
  cmd = cmd.startsWith("const") ? "const" : cmd == "locals" || cmd == "vars" ? "let" : "var";
  for(let i=1,end = std.count(ast); i < end; i += 2){
    let lhs = ast[i];
    let rhs = ast[i + 1];
    let out = mk_node(ast);
    let x = undefined;
    let rval = tx_STAR(rhs, env);
    if(std.symbol_QMRK(lhs)){
      x = lhs;
      lhs = tx_STAR(lhs, env);
      if("let" != cmd){
        rt.addVar([x].join(""), new Map([["ns", std._STAR_ns_STAR()]]));
      }
      std.assoc_BANG(keys, lhs, lhs);
      std.conj_BANG(vs, [x].join(""));
      ret.add([cmd, " ", lhs, "=", rval, ";\n"]);
    }else{
      ret.add(["let ", tx_STAR(dstru_STAR(lhs, out, env), env), "=", rval, ";\n", out]);
    }
  }
  if(pub_QMRK){
    vs.forEach(a=> std.conj_BANG(_STAR_vars_STAR, a));
    function GS__45(a,b){
      return std.assoc_BANG(_STAR_externs_STAR, b,a)
    }
    if(std.object_QMRK(keys)){
      Object.keys(keys).forEach(p=> GS__45(std.getProp(keys, p), p));
    }else{
      keys.forEach(GS__45)
    }
  }
  return ret;
}
SPEC_DASH_OPS["const-"] = sf_DASH_var;
SPEC_DASH_OPS["const"] = sf_DASH_var;
SPEC_DASH_OPS["def-"] = sf_DASH_var;
SPEC_DASH_OPS["def"] = sf_DASH_var;
SPEC_DASH_OPS["vars"] = sf_DASH_var;
SPEC_DASH_OPS["locals"] = sf_DASH_var;
////////////////////////////////////////////////////////////////////////////////
//Evaluates x and tests if it is an instance of the class
//c. Returns true or false.
//(inst? c x)
function sf_DASH_inst_QMRK(ast, env){
  assertArity(std.count(ast) === 3, ast);
  return wrap(mk_node(ast), null, ["(", tx_STAR(ast[2], env), " instanceof ", tx_STAR(ast[1], env), ")"]);
}
SPEC_DASH_OPS["inst?"] = sf_DASH_inst_QMRK;
//////////////////////////////////////////////////////////////////////////////
//Delete an object or property of an object.
function sf_DASH_delete(ast, env){
  assertArity(std.count(ast) >= 2 && std.count(ast) < 4, ast);
  let ret = mk_node(ast);
  ret.add(["delete ", tx_STAR(ast[1], env)]);
  if(std.count(ast) > 2){
    ret.add(["[", tx_STAR(ast[2], env), "]"]);
  }
  return ret;
}
SPEC_DASH_OPS["delete!"] = sf_DASH_delete;
//////////////////////////////////////////////////////////////////////////////
//Remove a key from Map.
function sf_DASH_dissoc_BANG(ast, env){
  assertArity(std.count(ast) === 3, ast);
  return mk_node(ast).add([slib_BANG([KBSTDLR, ".", tx_STAR(std.symbol("dissoc!"), env)].join("")),
    "(",
    tx_STAR(ast[1], env), ",", tx_STAR(ast[2], env), ")"]);
}
SPEC_DASH_OPS["dissoc!"] = sf_DASH_dissoc_BANG;
//////////////////////////////////////////////////////////////////////////////
//The args, if any, are evaluated from left to right,
//and passed to the constructor of the class
//named by Classname. The constructed object is returned.
//e.g.
//(new Error 'a' 3)
function sf_DASH_new(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  return wrap(mk_node(ast), "new ", tx_STAR(xfi(ast, ast.slice(1)), env));
}
SPEC_DASH_OPS["new"] = sf_DASH_new;
//////////////////////////////////////////////////////////////////////////////
//Throw an exception
function sf_DASH_throw(ast, env){
  assertArity(std.count(ast) === 2, ast);
  let ret = mk_node(ast);
  let stmtQ = stmt_QMRK(ast);
  ret.add(["throw ", tx_STAR(xfi(ast, ast[1]), env)]);
  if(!stmtQ){
    wrap(ret, "(function (){ ", ";}).call(this)");
  }
  return ret;
}
SPEC_DASH_OPS["throw"] = sf_DASH_throw;
//////////////////////////////////////////////////////////////////////////////
//Unary operator for increment & decrement
function sf_DASH_x_DASH_opop(ast, env){
  assertArity(std.count(ast) === 2, ast);
  let cmd = [ast[0]].join("");
  let a2 = tx_STAR(ast[1], env);
  return mk_node(ast).add(cmd.endsWith("$") ? [a2, cmd.slice(0, -1)] : [cmd, a2]);
}
SPEC_DASH_OPS["++"] = sf_DASH_x_DASH_opop;
SPEC_DASH_OPS["--"] = sf_DASH_x_DASH_opop;
SPEC_DASH_OPS["++$"] = sf_DASH_x_DASH_opop;
SPEC_DASH_OPS["--$"] = sf_DASH_x_DASH_opop;
//////////////////////////////////////////////////////////////////////////////
//Compound assignment operators
function sf_DASH_x_DASH_eq(ast, env){
  assertArity(std.count(ast) === 3, ast);
  let a0 = [ast[0]].join("");
  let cmd;
  switch(a0){
    case "unsigned-bit-shift-right=":
      cmd = ">>>=";
      break;
    case "bit-shift-right=":
      cmd = ">>=";
      break;
    case "bit-shift-left=":
      cmd = "<<=";
      break;
    case "bit-xor=":
      cmd = "^=";
      break;
    case "bit-or=":
      cmd = "|=";
      break;
    case "bit-and=":
      cmd = "&=";
      break;
    case "div=":
      cmd = "/=";
      break;
    case "rem=":
      cmd = "%=";
      break;
    case "exp=":
      cmd = "**=";
      break;
    default:
      cmd = a0;
      break;
  }
  return wrap(mk_node(ast), "(", [tx_STAR(ast[1], env), " ", cmd, " ", tx_STAR(ast[2], env), ")"]);
}
SPEC_DASH_OPS["+="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["-="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["*="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["/="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["div="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["rem="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["exp="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["bit-and="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["bit-or="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["bit-xor="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["bit-shift-left="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["bit-shift-right="] = sf_DASH_x_DASH_eq;
SPEC_DASH_OPS["unsigned-bit-shift-right="] = sf_DASH_x_DASH_eq;
//////////////////////////////////////////////////////////////////////////////
//Object property assignment or array index setter.
function sf_DASH_assoc_BANG(ast, env){
  assertArity(std.modulo(std.count(ast), 2)===0, ast);
  let ret = mk_node(ast);
  let obj = tx_STAR(ast[1], env);
  for (let a,i=2,end=std.count(ast); i<end; i += 2){
    a = ast[i];
    if(i > 2)
      ret.add(",");
    ret.add([slib_BANG([KBSTDLR, ".", tx_STAR(std.symbol("assoc!"), env)].join("")),
             "(", obj, ",", tx_STAR(xfi(ast, a), env), ",", tx_STAR(xfi(ast, ast[i+1]), env), ")"]);
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS["assoc!"] = sf_DASH_assoc_BANG;
//////////////////////////////////////////////////////////////////////////////
//Object property assignment or array index setter.
function sf_DASH_assign_BANG(ast, env){
  assertArity(std.modulo(std.count(ast), 2)===0, ast);
  let ret = mk_node(ast);
  let obj = tx_STAR(ast[1], env);
  for (let a,i=2,end = std.count(ast); i<end; i += 2){
    a= ast[i];
    if(i > 2)
      ret.add(",");
    ret.add([obj, "[", tx_STAR(xfi(ast, a), env), "]", "=", tx_STAR(xfi(ast, ast[i + 1]), env)]);
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS["oset!"] = sf_DASH_assign_BANG;
SPEC_DASH_OPS["aset"] = sf_DASH_assign_BANG;
//////////////////////////////////////////////////////////////////////////////
//Set value(s) to variable(s).
//e.g. (set! a 2 b 4 ...)
function sf_DASH_set(ast, env){
  let ret = mk_node(ast);
  assertArity(std.modulo(std.count(ast), 2) !== 0, ast);
  for(let a, i = 1,end = std.count(ast); i < end; i += 2){
    a= ast[i];
    if(i > 1)
      ret.add(",");
    ret.add([tx_STAR(a, env), "=", tx_STAR(xfi(ast, ast[i + 1]), env)]);
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS["set!"] = sf_DASH_set;
SPEC_DASH_OPS["var-set"] = sf_DASH_set;
//////////////////////////////////////////////////////////////////////////////
//Defines an anonymous function. See defn.
//(fn attrs? [x y] ...)
function sf_DASH_fn(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let body = xfi(ast, ast.slice(2));
  let GS__48 = meta_QMRK__QMRK(ast[1], env);
  let args = std.getIndex(GS__48, 1);
  if(!Array.isArray(args))
    error_BANG("invalid-fargs", ast);
  let fargs = doFuncArgs(xfi(ast, args), env);
  return wrap(mk_node(ast), null, ["function (", fargs[0], ") {\n", fargs[1], txDo(body, env, true), "}"]);
}
SPEC_DASH_OPS["fn"] = sf_DASH_fn;
//////////////////////////////////////////////////////////////////////////////
//Defines a function. Use defn- to indicate privacy (no export).
//(defn name doc-string? attr-map? [params*] ...)
function sf_DASH_func(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let mtd_QMRK = [ast[0]].join("") == "method";
  let pub_QMRK = isPub_QMRK(ast);
  let fname0 = [ast[1]].join("");
  let fname = [tx_STAR(ast[1], env)].join("");
  let dot_QMRK = std.contains_QMRK(fname, ".");
  let ret = mk_node(ast, tnodeEx(fname));
  let GS__49 = typeof(ast[2]) == "string" ? [ast[2], 3] : [null, 2];
  let [doc,pargs] = GS__49;
  let body = xfi(ast, ast.slice(pargs + 1));
  let b1 = body[0];
  let GS__50 = meta_QMRK__QMRK(ast[pargs], env);
  let [attrs,args] = GS__50;
  if(!mtd_QMRK)
    rt.addVar(fname0, new Map([["ns", std._STAR_ns_STAR()]]));
  if(!Array.isArray(args))
    error_BANG("invalid-fargs", ast);
  let pre = undefined;
  let post = undefined;
  let fargs = doFuncArgs(xfi(ast, args), env);
  attrs = attrs || new Map([]);
  if(std.map_QMRK(b1)){
    for(let e2,e,i = 0, end = std.count(b1); i < end; i += 2){
      e = b1[i];
      e2 = b1[i + 1];
      if(std.keyword_QMRK(e) && Array.isArray(e2)){
        if(e == "post"){
          post = e2
        }else if(e == "pre"){
          pre = e2
        }
      }
    }
  }
  if(mtd_QMRK){
    if(attrs.static)
      ret.add("static ");
    ret.add([fname, " ("].join(""));
    if(fname == "constructor")
      std.conj_BANG(body, std.symbol("this"));
  }else if(dot_QMRK){
    ret.add([fname, " = function ("].join(""))
  }else{
    ret.add(["const ", fname, " = function ("].join(""))
  }
  ret.add([fargs[0], ") {\n", fargs[1]]);
  if(pre || post){
    body = body.slice(1);
    ret.add(writeFuncPre(xfi(ast, pre), env));
  }
  ret.add([txDo(body, env, true), "};\n"]);
  if(std.not_DASH_empty(attrs))
    ret.add(fmtSpecOps(fname, attrs));
  if(doc)
    ret.prepend(writeDoc(doc));
  if(pub_QMRK && !dot_QMRK && !mtd_QMRK){
    std.conj_BANG(_STAR_vars_STAR, fname0);
    std.assoc_BANG(_STAR_externs_STAR, fname, fname);
  }
  return ret.prepend(writeFuncInfo(fname0, ast));
}
SPEC_DASH_OPS["defn"] = sf_DASH_func;
SPEC_DASH_OPS["defn-"] = sf_DASH_func;
//////////////////////////////////////////////////////////////////////////////
//The exprs are evaluated and, if no exceptions occur, the value of the last
//is returned. If an exception occurs and catch clauses are provided, each is
//examined in turn and the first for which the thrown exception is an instance
//of the named class is considered a matching catch clause. If there is a
//matching catch clause, its exprs are evaluated in a context in which name is
//bound to the thrown exception, and the value of the last is the return value
//of the function. If there is no matching catch clause, the exception
//propagates out of the function. Before returning, normally or abnormally,
//any finally exprs will be evaluated for their side effects.
function sf_DASH_try(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let stmtQ = stmt_QMRK(ast);
  let t = undefined;
  let f = undefined;
  let c = undefined;
  let sz = std.count(ast);
  let ret = mk_node(ast);
  f = std.last(ast);
  if(Array.isArray(f) && [f[0]].join("") == "finally"){
    pop_BANG(ast);
    sz = std.count(ast);
    xfi(f[0], f);
  }else{
    f = null
  }
  c = null;
  if(sz > 1)
    c = ast[sz - 1];
  if(Array.isArray(c) && [c[0]].join("") == "catch"){
    if(std.count(c) < 2 || !std.symbol_QMRK(c[1])){
      error_BANG("invalid-catch", ast)
    }
    pop_BANG(ast);
    xfi(c[0], c);
  }else{
    c = null
  }
  if(f === null && c === null)
    error_BANG("invalid-try", ast);
  ret.add(["try {\n", txDo(exprHint(xfi(ast, ast.slice(1)), !stmtQ), env), "\n}"]);
  if(c){
    t = c[1];
    ret.add(["catch (", tx_STAR(t, env), ") {\n",
             txDo(exprHint(xfi(c, c.slice(2)), !stmtQ), env), ";\n}\n"]);
  }
  if(f)
    ret.add(["finally {\n", txDo(exprHint(xfi(f, f.slice(1)), false), env, false), ";\n}\n"]);
  if(!stmtQ){
    wrap(ret, "(function(){\n", "}).call(this)");
  }
  return ret;
}
SPEC_DASH_OPS["try"] = sf_DASH_try;
//////////////////////////////////////////////////////////////////////////////
//Evaluates test. If truthy evaluates 'then' otherwise 'else'.
//(if test then else)
//(if test then)
function sf_DASH_if(ast, env){
  assertArity(std.count(ast) >= 3, ast);
  let stmtQ = stmt_QMRK(ast);
  let ret = mk_node(ast);
  let a1 = exprHint(xfi(ast, ast[1]), true);
  let a2 = exprHint(xfi(ast, ast[2]), !stmtQ);
  let m_QMRK = std.count(ast) > 3;
  let a3 = m_QMRK ? xfi(ast, ast[3]) : null;
  let elze = m_QMRK ? exprHint(a3, !stmtQ) : null;
  a1 = tx_STAR(a1, env);
  a2 = tx_STAR(a2, env);
  elze = tx_STAR(elze, env);
  return wrap(ret, null, (stmtQ ?
    ["if (", a1, ") {\n", a2, ";\n}",(m_QMRK ?
      [" else { \n", elze, ";\n}"].join("") :
      "")] :
    ["(", a1, " ?\n", a2, " :\n",(elze || "null"), ")"]));
}
SPEC_DASH_OPS["if"] = sf_DASH_if;
//////////////////////////////////////////////////////////////////////////////
//Returns the named property of an object,
//or value at the index of an array.
//(get obj "age")
//(aget obj 4)
//(nth obj 3)
function sf_DASH_get(ast, env){
  assertArity(std.count(ast) === 3, ast);
  let ret = mk_node(ast);
  let a0 = [ast[0]].join("");
  let cmd = slib_BANG(GET_DASH_PROP);
  return a0 != "get" ?
    wrap(ret, null, [tx_STAR(xfi(ast, ast[1]), env), "[", tx_STAR(xfi(ast, ast[2]), env), "]"]) :
    wrap(ret, null, [cmd, "(", tx_STAR(xfi(ast, ast[1]), env), ",", tx_STAR(xfi(ast, ast[2]), env), ")"]);
}
SPEC_DASH_OPS["oget"] = sf_DASH_get;
SPEC_DASH_OPS["nth"] = sf_DASH_get;
SPEC_DASH_OPS["get"] = sf_DASH_get;
SPEC_DASH_OPS["aget"] = sf_DASH_get;
//////////////////////////////////////////////////////////////////////////////
//Creates a new vector containing the args.
//(vec "hello" "world")
//(vec 1 2 3)
//[1 2 3]
//["hello" "world"]
function sf_DASH_array(ast, env){
  let ret = mk_node(ast);
  assertArity(true, ast);
  if(!std.vector_QMRK(ast)){
    if("vec" == [ast[0]].join("") || "array" == [ast[0]].join("")){}else{
      throw new Error(["syntax-error", "expecting vec"].join(""))
    }
    ast = ast.slice(1)
  }
  for(let a,i = 0, sz = std.count(ast); i < sz; ++i){
    a= ast[i];
    ret.add(tx_STAR(xfi(ast, a_QUOT), env));
  }
  ret.join(",");
  return wrap(ret, "[", "]");
}
SPEC_DASH_OPS["vec"] = sf_DASH_array;
SPEC_DASH_OPS["array"] = sf_DASH_array;
//////////////////////////////////////////////////////////////////////////////
//Returns a new object with supplied key-mappings.
//(object "a" 1 "b" 2)
//{:a 1 :b 2}
function sf_DASH_objObj(ast, env){
  let ret = mk_node(ast);
  assertArity(true, ast);
  if(!std.obj_QMRK(ast)){
    if("object" == [ast[0]].join("") || "js-obj" == [ast[0]].join("")){}else{
      throw new Error(["syntax-error", "expecting object"].join(""));
    }
    ast = ast.slice(1);
  }
  for(let a,i=0,end = std.count(ast); i<end; i += 2){
    a = ast[i];
    ret.add([tx_STAR(a_QUOT, env), ": ", tx_STAR(xfi(ast, ast[i + 1]), env)].join(""));
  }
  ret.join(",");
  return wrap(ret, "{", "}");
}
SPEC_DASH_OPS["object"] = sf_DASH_objObj;
SPEC_DASH_OPS["js-obj"] = sf_DASH_objObj;
//////////////////////////////////////////////////////////////////////////////
function sf_DASH_mapObj(ast, env){
  let ret = mk_node(ast);
  assertArity(true, ast);
  if(!std.map_QMRK(ast)){
    if("hash-map" != [ast[0]].join("")){
      throw new Error(["syntax-error", "expecting hash-map"].join(""))
    }else{
      ast = ast.slice(1)
    }
  }
  for(let a, i = 0,end = std.count(ast); i < end; i += 2){
    a= ast[i];
    ret.add(["[", tx_STAR(a, env), ",", tx_STAR(xfi(ast, ast[i + 1]), env), "]"].join(""));
  }
  ret.join(",");
  return wrap(ret, "(new Map([", "]))");
}
SPEC_DASH_OPS["hash-map"] = sf_DASH_mapObj;
//////////////////////////////////////////////////////////////////////////////
//Returns a new Set.
//(set 1 2 3)
function sf_DASH_setObj(ast, env){
  let ret = mk_node(ast);
  assertArity(true, ast);
  if(!std.set_QMRK(ast)){
    if("hash-set" != [ast[0]].join(""))
      throw new Error(["syntax-error", "expecting hash-set"].join(""));
    ast = ast.slice(1)
  }
  for(let a,i = 0,sz = std.count(ast); i < sz; ++i){
    a= ast[i];
    ret.add(tx_STAR(a, env));
  }
  ret.join(",");
  return wrap(ret, "(new Set([", "]))");
}
SPEC_DASH_OPS["hash-set"] = sf_DASH_setObj;
//////////////////////////////////////////////////////////////////////////////
function require_BANG(path){
  try {
    return require(path)
  }catch (e){
    println("warning: failed to load lib: ", path)
  }
}
//////////////////////////////////////////////////////////////////////////////
function sf_DASH_require2(ret, fdir, ast, env){
  let used, rlib, mcs, nsp, vvv, info, libpath, refers, renames;
  let as = [std.gensym("R__")].join("");
  let rpath = [ast[0]].join("");

  if(std.symbol_QMRK(rpath))
    rpath = std.quote_DASH_str([rpath].join(""))

  for(let v,j = 1, end = std.count(ast); j < end; j += 2){
    v = ast[j];
    if("as" == v){
      as = [ast[(j + 1)]].join("")
    }else if("refer" == v){
      refers = ast[j + 1]
    }else if("rename" == v){
      renames = ast[j + 1]
    }
  }
  libpath = tx_STAR(std.contains_QMRK(rpath, "./") ? path.resolve(fdir, rpath) : rpath, env);
  ret.add(["const ", reader.jsid(as), "= require(", tx_STAR(rpath, env), ");\n"]);
  rlib = require_BANG(std.unquote_DASH_str(libpath));
  if(rlib)
    info = std.getProp(rlib, EXPKEY);
  rt.addLib([as].join(""), rlib);
  if(info){
    mcs = std.getProp(info, "macros");
    vvv = loadRVars(info, env);
    nsp = loadRLib(info, env);
  }
  mcs = mcs || new Map([]);
  vvv = vvv || [];
  used = new Set([]);
  nsp = nsp || "";
  if(std.keyword_QMRK(refers) && vvv && refers == "all"){
    refers = vvv[0]
  }
  for(let i=0, end = std.count(renames); i < end; i += 2){
    let ro = renames[i];
    let rn = renames[i + 1];
    let ev = [ro].join("");
    let rs = [rn].join("");
    if(info){
      if(std.getProp(mcs, ev) || std.contains_QMRK(vvv[1], ev)){}else{
        throw new Error(["Unknown var: '", ev, "'"].join(""))
      }
      if(std.getProp(mcs, rs) || std.contains_QMRK(vvv[1], rs)){
        throw new Error(["Cannot rename var: '", ev, "' to existing var: '", rs, "'"].join(""))
      }
    }
    rt.addVar(rs, new Map([["ns", nsp]]));
    used.push(ev);
    ret.add(["const ", tx_STAR(rn, env), "=", as, "[\"", tx_STAR(ro, env), "\"];\n"]);
  }
  for(let i = 0, end = std.count(refers); i < end; ++i){
    let r = refers[i];
    let rs = [r].join("");
    let v = tx_STAR(r, env);
    if(!std.contains_QMRK(used, rs)){
      if(info){
        if(std.getProp(mcs, rs) || std.contains_QMRK(vvv[1], rs)){}else{
          throw new Error(["Unknown var: '", rs, "'"].join(""))
        }
      }
      rt.addVar(rs, new Map([["ns", nsp]]));
      ret.add(["const ", v, "=", as, "[\"", v, "\"];\n"]);
    }
  }
}
//////////////////////////////////////////////////////////////////////////////
//Loads libs.
//(:require ["z" :rename {hello goodbye}])
//(:require ["a" :as A])
//(:require ["b"]
//["c" :refer [hello world]])
function sf_DASH_require(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let ret = mk_node(ast);
  let fdir = path.dirname(ast.source);
  for(let a,i = 0, GS__59 = ast.slice(1), sz = std.count(GS__59); i < sz; ++i){
    a= GS__59[i];
    if(Array.isArray(a) && (std.symbol_QMRK(a[0]) || typeof(a[0]) == "string")){}else{
      error_BANG("invalid-require", ast)
    }
    sf_DASH_require2(ret, fdir, a, env);
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//(ns name doc-string? attr-map? references*)
//Creates a namespace, references can be zero or more of:
//(:require ...)
//(ns ^{:doc "some doc"} hello.world.core ...)
function sf_DASH_ns(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let ret = [];
  let doc = null;
  let e = null;
  let mobj = null;
  let pos = 2;
  let GS__61 = meta_QMRK__QMRK(ast[1], env);
  let [attrs,nsp] = GS__61;
  if(!std.symbol_QMRK(nsp))
    error_BANG("invalid-namespace", ast);
  if(typeof(ast[pos]) == "string"){
    attrs = attrs || new Map([]);
    std.assoc_BANG(attrs, "doc", ast[pos]);
    ++pos;
  }
  if(std.map_QMRK(ast[pos])){
    mobj = evalMeta(ast[pos], env);
    attrs = merge(attrs, mobj);
    ++pos;
    nsp["____meta"] = attrs;
  }
  std.pushNSP([nsp].join(""), attrs);
  ast = xfi(ast, ast.slice(pos));
  for(let e,i = 0, sz = std.count(ast); i < sz; ++i){
    e = ast[i];
    if(std.pairs_QMRK(e) && [e[0]].join("") == "require")
      std.conj_BANG(ret, sf_DASH_require(xfi(ast, e), env))
  }
  nsp = std._STAR_ns_STAR();
  if(nsp == [KBPFX, "stdlib"].join("")){}else{
    if(nsp.startsWith(KBPFX)){
      std.conj_BANG(ret, ["const ", KBSTDLR, "=std;\n"].join(""))
    }else{
      std.conj_BANG(ret, sf_DASH_require(xfi(ast, [std.symbol("require"),
                                                   ["kirby", std.keyword(":as"),
                                                    std.symbol("kirbystdlibref")]]), env));
    }
  }
  return std.conj_BANG(ret, ["const ", std.MODULE_NAMESPACE, "= ", std.quote_DASH_str(nsp), ";\n"].join(""));
}
SPEC_DASH_OPS["ns"] = sf_DASH_ns;
//////////////////////////////////////////////////////////////////////////////
function sf_DASH_comment(ast, env){
  return ""
}
SPEC_DASH_OPS["comment"] = sf_DASH_comment;
//////////////////////////////////////////////////////////////////////////////
//Generates native for loop.
function sf_DASH_while(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let stmtQ = stmt_QMRK(ast);
  let ret = mk_node(ast);
  let body = exprHint(xfi(ast, ast.slice(2)), false);
  return std.count(body)===0 ? ret : sf_DASH_wloop(ret, ast[1], body, env, stmtQ)
}
SPEC_DASH_OPS["while"] = sf_DASH_while;
//////////////////////////////////////////////////////////////////////////////
//For loop implementation
function sf_DASH_wloop(ret, tst, body, env, stmtQ){
  let nb = [std.symbol("not"), std.symbol("____break")];
  ret.add("for (let ____break=false; ");
  xfi(ret, nb);
  tst = [std.symbol("and"), nb, tst];
  xfi(ret, tst);
  ret.add([tx_STAR(tst, env), ";", "){\n", txDo(body, env, false), "}\n"]);
  if(!stmtQ)
    wrap(ret, "(function() {\n", "; return null; }).call(this)");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Generates native for loop.
function sf_DASH_forxxx(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let stmtQ = stmt_QMRK(ast);
  let ret = mk_node(ast);
  let body = exprHint(xfi(ast, ast.slice(2)), false);
  return std.count(body)===0 ?
    ret :
    sf_DASH_foop(ret, [ast[0]].join(""), xfi(ast, ast[1]), body, env, stmtQ);
}
SPEC_DASH_OPS["floop"] = sf_DASH_forxxx;
SPEC_DASH_OPS["rloop"] = sf_DASH_forxxx;
//////////////////////////////////////////////////////////////////////////////
//For loop implementation
function sf_DASH_foop(ret, cmd, args, body, env, stmtQ){
  let vars = [std.symbol("____coll"), null, std.symbol("____index"), 0];
  let indexer, tst, nb, sz, lvar, coll, start, end, step;
  let incr_QMRK = cmd == "floop";
  let decr_QMRK = cmd == "rloop";
  let recurs = [];
  let begin = 0;
  if(std.symbol_QMRK(args[0])){
    begin = 2;
    lvar = args[0];
    coll = args[1];
    vars = [std.symbol("____coll"), coll, std.symbol("____index"), 0];
  }
  for(let e,i = begin, end = std.count(args); i < end; i += 2){
    e = args[i];
    if(e == "while"){
      tst = args[i + 1]
    }else if(e == "index"){
      vars[2] = args[i + 1]
    }else if(e == "recur"){
      recurs = args[i + 1]
    }else if(e == "start"){
      start = args[i + 1]
    }else if(e == "end"){
      end = args[i + 1]
    }else if(e == "step"){
      step = args[i + 1]
    }else if(std.symbol_QMRK(e)){
      std.conj_BANG(vars, e, args[i + 1])
    }
  }
  indexer = vars[2];
  if(typeof(start) == "undefined"){
    if(incr_QMRK){ start = 0 }
    if(decr_QMRK)
      start = [std.symbol("-"), [std.symbol("n#"), std.symbol("_coll")], 1]
  }
  vars[3] = start;
  if(typeof(end) == "undefined"){
    end = decr_QMRK ? -1 : incr_QMRK ? [std.symbol("n#"), std.symbol("____coll")] : null;
  }
  std.conj_BANG(vars, std.symbol("____end"), end);
  if(typeof(tst) == "undefined"){
    if(incr_QMRK)
      tst = [std.symbol("<"), indexer, std.symbol("____end")];
    if(decr_QMRK)
      tst = [std.symbol(">"), indexer, std.symbol("____end")];
  }
  ret.add("for (");
  for(let e, i = 0, end = std.count(vars); i < end; i += 2){
    e = vars[i];
    if(i === 0)
      ret.add("let ");
    if(i !== 0)
      ret.add(",");
    ret.add([tx_STAR(e, env), "=", tx_STAR(vars[i + 1], env)]);
  }
  ret.add([",", BREAK, "=false;"]);
  nb = [std.symbol("not"), std.symbol("____break")];
  xfi(ret, nb);
  tst = typeof(tst) != "undefined" ? [std.symbol("and"), nb, tst] : nb;
  xfi(ret, tst);
  ret.add([tx_STAR(tst, env), "; "]);
  if(typeof(step) == "undefined"){ step = 1 }
  if(incr_QMRK)
    std.cons_BANG([std.symbol("+"), indexer, step], recurs);
  if(decr_QMRK)
    std.cons_BANG([std.symbol("-"), indexer, step], recurs);
  for(let e,i = 0, k = 2, end = std.count(recurs); i < end; ++i, k += 2){
    e = recurs[i];
    if(i !== 0)
      ret.add(",");
    ret.add([tx_STAR(vars[k], env), "=", tx_STAR(e, env)]);
  }
  ret.add(["){\n",(typeof(lvar) != "undefined" ?
    sf_DASH_var(xfi(args, [std.symbol("vars"), lvar,
                           [std.symbol("nth"), std.symbol("____coll"), indexer]]), env) : ""), txDo(body, env, false), "}\n"]);
  if(!stmtQ)
    wrap(ret, "(function() {\n", "; return null; }).call(this)");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Inject raw native code fragment.
//(raw# "console.log('hi');")
function sf_DASH_jscode(ast, env){
  assertArity(std.count(ast) >= 2, ast);
  let s = [ast[1]].join("");
  let name = reader.jsid("sf-jscode");
  return mk_node(ast, tnodeEx(name, s.endsWith("\"") && s.startsWith("\"") ? s.slice(1, -1) : s));
}
SPEC_DASH_OPS["raw#"] = sf_DASH_jscode;
//////////////////////////////////////////////////////////////////////////////
//Like defn, but the resulting function name is declared as a
//macro and will be used as a macro by the compiler when it is
//called.
//(defmacro macro-name [args] ...)
function sf_DASH_macro(ast, env){
  assertArity(std.count(ast) >= 4, ast);
  let body = ast.slice(3);
  let x,mname, mobj, doc;
  let pms = [];
  let args = ast[2];
  if(typeof(args) == "string"){
    doc = args;
    args = ast[3];
    body = ast.slice( 4);
  }
  x = meta_QMRK__QMRK(args, env);
  args = x[1];
  mobj = x[0];
  for(let ev,e, i = 0, end = std.count(args); i < end; ++i){
    e = args[i];
    ev = [e].join("");
    if(ev == "&"){
      if(Array.isArray(args[i + 1])){
        e = args[i + 1];
        ++i;
        for(let x,j = 0, GS__66 = e, sz = std.count(GS__66); j < sz; ++j){
          x = GS__66[j];
          if(!std.symbol_QMRK(x))
            error_BANG("syntax-error", ast);
          pms.push(x)
        }
      }else{
        pms.push(e, args[i+1]);
        ++i;
      }
    }else if(!std.symbol_QMRK(e)){
      error_BANG("syntax-error", ast)
    } else {
      pms.push(e)
    }
  }
  mname = ast[1];
  ast = [std.symbol("macro*"), mname, pms, body[0]];
  rt.addVar(mname, new Map([["ns", std._STAR_ns_STAR()]]));
  if(mobj && std.getProp(mobj, "private") === true){}else{
    std.assoc_BANG(_STAR_macros_STAR, mname, prn(ast, true))
  }
  rt.compute(ast, env);
  return "";
}
SPEC_DASH_OPS["defmacro"] = sf_DASH_macro;
//////////////////////////////////////////////////////////////////////////////
//Special unary operators.
function sf_DASH_unary(ast, env){
  assertArity(std.count(ast) === 2, ast);
  let [a0,a1] = ast;
  if(a0 == "not"){ a0 = std.symbol("!") }
  return mk_node(ast).add(["(", [tx_STAR(a0, env)].join(""), [tx_STAR(a1, env)].join(""), ")"]);
}
SPEC_DASH_OPS["not"] = sf_DASH_unary;
SPEC_DASH_OPS["!"] = sf_DASH_unary;
//////////////////////////////////////////////////////////////////////////////
//List comprehension. Takes a vector of one or more
//binding-form/collection-expr pairs, each followed by zero or more
//modifiers, and yields a lazy sequence of evaluations of expr.
//Collections are iterated in a nested fashion, rightmost fastest,
//and nested coll-exprs can refer to bindings created in prior
//binding-forms.  Supported modifiers are: :let [binding-form expr ...],
//:while test, :when test.
function sf_DASH_listc(ast, env){
  let cap = std.gensym();
  return wrap(mk_node(ast), ["(function() {\n", "let ", [cap].join(""), "=[];\n"],
                            [sf_DASH_doseq(exprHint(ast, false), env, cap), "return ", [cap].join(""), ";\n}).call(this)"]);
}
SPEC_DASH_OPS["for"] = sf_DASH_listc;
//////////////////////////////////////////////////////////////////////////////
//Repeatedly executes body (presumably for side-effects) with
//bindings and filtering as provided by "for".  Does not retain
//the head of the sequence. Returns nil.
function sf_DASH_doseq(ast, env,capRes){
  let body = exprHint(xfi(ast, ast.slice(2)), false);
  let while_QUOT = std.gensym();
  let inner = "";
  let ret;
  let fst = true;
  let kount = slib_BANG(COUNT);
  let stmtQ = stmt_QMRK(ast);
  let args = ast[1];

  if(std.modulo(std.count(args), 2) !== 0){
    throw new Error("bindings not even")
  }

  let GS__70 = std.split_DASH_with(a=> !std.keyword_QMRK(a), args);
  let [x,y]= GS_70;
  let arr = std.rseq(std.partition(2, x));

  let recur = null;
  let _x_ = null;
  let _f_ = function(p1, pn){
    if(p1){
      let e_QUOT = std.gensym();
      let n_QUOT = std.gensym();
      ret = mk_node(ast);
      ret.add(["for(let ", [n_QUOT].join(""), "=0,",(0 === std.count(pn) ?
        [[while_QUOT].join(""), "=true,"].join("") :
        ""), [e_QUOT].join(""), "=", tx_STAR(p1[1], env), ",", "____sz=", kount, "(", [e_QUOT].join(""), ")",(fst ?
        ",____break=false" :
        ""), "; (",(fst ?
        "!____break && " :
        ""), [while_QUOT].join(""), " && ", "(", [n_QUOT].join(""), " < ____sz)", "); ++", [n_QUOT].join(""), "){\n"]);
      ret.add(std.sf_DASH_var(xfi(ast, [std.symbol("vars"), p1[0], [std.symbol("nth"), e_QUOT, n_QUOT]]), env));
      if(fst){
        fst = false;
        doseq_DASH_binds(while_QUOT, ret, y, body, ast, env, capRes);
      }else{
        ret.add(inner);
      }
      ret.add("}\n");
      inner = ret;
      return std.not_DASH_empty(pn) ? recur(pn[0], pn.slice(1)) : null;
    }
  };
  let _r_ = _f_;
  recur=function(...xs){
    if(_r_){
      for(_r_ = undefined; _r_ === undefined;){
        _r_ = _f_.apply(this, xs)
      }
      return _r_;
    }
  };
  recur(arr[0], arr.slice(1));
  if(!stmtQ)
    wrap(ret, "(function() {\n", "; return null; }).call(this)");
  return ret;
}
SPEC_DASH_OPS["doseq"] = sf_DASH_doseq;
//////////////////////////////////////////////////////////////////////////////
function doseq_DASH_binds(while_QUOT, ret, binds, body, ast, env, capRes){
  let patch = mk_node(ast);
  std.partition(2, binds).forEach(function(GS__71){
    let [k,expr] = GS__71;
    let GS__72 = k;
    if("let" == GS__72){
      ret.add(std.sf_DASH_var(xfi(ast, std.cons(std.symbol("vars"), expr))))
    }else if("when" == GS__72){
      ret.add(["if (", tx_STAR(expr, env), ") {\n"]);
      patch.add("}\n");
    }else if("while" == GS__72){
      ret.add(["if (!(", tx_STAR(expr, env), ")) { ", [while_QUOT].join(""), "=false; ____break=true; } else {\n"]);
      patch.add("}\n");
    }
  });
  if(capRes){
    exprHint(body, true);
    ret.add([[capRes].join(""), ".push((function() {\n", txDo(body, env, true), "\n}).call(this));\n"]);
  }else{
    ret.add(txDo(body, env, false));
  }
  return ret.add(patch);
}
//////////////////////////////////////////////////////////////////////////////
//Transfer source map info
function xfi(from, to){
  if(from && to && typeof(to.line) != "number" && typeof(from.line) == "number"){
    to["source"] = from.source;
    to["line"] = from.line;
    to["column"] = from.column;
  }
  return to;
}
//////////////////////////////////////////////////////////////////////////////
//Dump all macros to string.
function spitMacros(){
  return std.count(_STAR_macros_STAR)===0 ?
    "{}" :
    std.wrap_DASH_str((seq(_STAR_macros_STAR) || []).map(function(GS__73){
      let [k,v] = GS__73;
      return [std.quote_DASH_str([k].join("")), ":", std.quote_DASH_str(v)].join("");
    }).join(",\n"), "{\n", "}\n");
}
//////////////////////////////////////////////////////////////////////////////
//Dump all public vars to string.
function spitVars(){
  return std.count(_STAR_vars_STAR)===0 ?
    "[]" :
    std.wrap_DASH_str((_STAR_vars_STAR || []).map(a=> std.quote_DASH_str([a].join(""))).join(","), "[ ", "]");
}
//////////////////////////////////////////////////////////////////////////////
//Write out export info
function spitExterns(){
  return ["\n\nmodule.exports = {\n",
          [EXPKEY, ": { ns: ",
           std.quote_DASH_str(std._STAR_ns_STAR()),
           ", vars: ", spitVars(), ", macros: ", spitMacros(), " }"].join(""),
           (std.not_DASH_empty(_STAR_vars_STAR) ?
           [",\n", (_STAR_vars_STAR || []).map(a=> [reader.jsid(a), ":", reader.jsid(a)].join("")).join(",\n")].join("") : null), "\n};\n"].join("");
}
//////////////////////////////////////////////////////////////////////////////
//Banner text for the target file
function banner(){
  let GS__74 = std.peekNSP();
  let id = std.getProp(GS__74, "id");
  let meta = std.getProp(GS__74, "meta");
  return ["/*", "Auto generated by Kirby v", MOD_DASH_VER,
          " - ", new Date(), "\n",
          "  ", id, "\n",(meta ? prn(meta, true) : ""), "\n", "*/\n\n"].join("");
}
//////////////////////////////////////////////////////////////////////////////
//Get rid of empty lines or no-op lines
function cleanCode(code){
  return ((code.split("\n") || []).map(function(a){
    let s = a.trim();
    return std.count(s) > 0 ? (s != ";" ? a : null) : null;
  }) || []).filter(a=> not_DASH_empty(a)).join("\n");
}
//////////////////////////////////////////////////////////////////////////////
//Compiles a source file, returning the translated source and
//possible error object.
function transpile_STAR(source, fname, options){
  let source_DASH_map = std.getProp(options, "source-map");
  let no_DASH_format = std.getProp(options, "no-format");
  let verbose = std.getProp(options, "verbose");
  let err,ret = txTree(reader.parse(source, fname), rt.genv());
  let [fmap,smap]= [".js", ".map"].map(a=> [path.basename(fname, ".ky"), a].join(""));
  if(source_DASH_map){
    let sout = ret.toStringWithSourceMap({ skipValidation: true, file: fmap });
    ret = sout.code;
    fs.writeFileSync(smap, sout.map);
  }
  cstr = [ret, spitExterns(),
          source_DASH_map ? ["\n//# sourceMappingURL=", path.relative(path.dirname(fname), smap)].join("") : null].join("");
  try{
    if(!no_DASH_format)
      cstr = esfmt.format(cstr, {});
  }catch(e){
    err = e
  }
  cstr = cleanCode(cstr);
  return [std.count(cstr)===0 ? "" : [banner(), cstr].join(""), err];
}
//////////////////////////////////////////////////////////////////////////////
//Compile kirby file to target source
function transpile(code, file,options){
  _STAR_last_DASH_line_STAR = 0;
  _STAR_last_DASH_col_STAR = 0;
  _STAR_externs_STAR = new Map([]);
  _STAR_macros_STAR = new Map([]);
  _STAR_vars_STAR = std.into_BANG("vector", []);
  try{
    return transpile_STAR(code, file, opt_QMRK__QMRK(options, {}))
  }catch(e){
    println("Error near line: ", _STAR_last_DASH_line_STAR, ", col: ", _STAR_last_DASH_col_STAR, "\n", [e].join(""))
  }
}
//////////////////////////////////////////////////////////////////////////////
//Dump AST to xml
function dbgAST(source, fname){
  return reader.dumpTree(reader.parse(source, fname), fname)
}
const version = MOD_DASH_VER;
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.compiler",
    vars: ["tnodeEx", "tnode", "sf-juxt", "transpile", "dbgAST", "version"],
    macros: {}
  },
  tnodeEx: tnodeEx,
  tnode: tnode,
  sf_DASH_juxt: sf_DASH_juxt,
  transpile: transpile,
  dbgAST: dbgAST,
  version: version
};

//////////////////////////////////////////////////////////////////////////////
//EOF

