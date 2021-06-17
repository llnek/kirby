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
const esfmt = require("esformatter");
const smap = require("source-map");
const fs = require("fs");
const path = require("path");
const rdr = require("./reader");
const std = require("./stdlib");
const rt = require("./engine");
const {KBSTDLR,
KBSTDLIB,
KBPFX,
EXPKEY} = rt;
const println=std["println"];
//////////////////////////////////////////////////////////////////////////////
const ERRORS_DASH_MAP = new Map([
  ["no-sourcemap-info", "Expected source map info"],
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
const GET_DASH_INDEX = `${KBSTDLR}.getIndex`;
const GET_DASH_PROP = `${KBSTDLR}.getProp`;
const KEYW = `${KBSTDLR}.keyword`;
const SYMB = `${KBSTDLR}.symbol`;
const COUNT = `${KBSTDLR}.count`;
const MODLO = `${KBSTDLR}.mod`;
const JSARGS = "arguments";
const LARGS = "____args";
const BREAK = "____break";
const MOD_DASH_VER = "1.0.0";
var _STAR_externs_STAR = undefined;
var _STAR_macros_STAR = undefined;
var _STAR_vars_STAR = undefined;
var _STAR_last_DASH_line_STAR = 0;
var _STAR_last_DASH_col_STAR = 0;
var SPEC_DASH_OPS = {};
var MATH_DASH_OP_DASH_REGEX = /^[-+][0-9]+$/;
//////////////////////////////////////////////////////////////////////////////
//Defining a primitive data type
class Primitive{
  constructor(v){ this.value = v }
  toString(){ return this.value }
}
//////////////////////////////////////////////////////////////////////////////
function isAstMap(ast){
  return Array.isArray(ast) && ast.length> 0 && std.symbol(ast[0]) && "hashmap*"==`${ast[0]}`
}
//////////////////////////////////////////////////////////////////////////////
function isAstSet(ast){
  return Array.isArray(ast) && ast.length> 0 && std.symbol(ast[0]) && "hashset*"==`${ast[0]}`
}
//////////////////////////////////////////////////////////////////////////////
function isAstVec(ast){
  return Array.isArray(ast) && ast.length> 0 && std.symbol(ast[0]) && "vector*"==`${ast[0]}`
}
//////////////////////////////////////////////////////////////////////////////
function isAstObj(ast){
  return Array.isArray(ast) && ast.length> 0 && std.symbol(ast[0]) && "object*"==`${ast[0]}`
}

//////////////////////////////////////////////////////////////////////////////
/**Ensure name is compliant
 * @private */
function unmangle(s){
  return s.split(".").map(a=> rdr.jsid(a)).join(".")
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function isStr(s){ return typeof(s)=="string" }
/** @private */
function isEven(n){ return n % 2 === 0 }
/** @private */
function isOdd(n){ return n % 2 !== 0 }
//////////////////////////////////////////////////////////////////////////////
/** @private */
function tnodeEx(name,chunk){
  return tnode(null, null, null, chunk, name)
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function tnode(src,ln,col,chunk,name){
  return new smap.SourceNode(std.opt_QMRK__QMRK(ln, null),
                             std.opt_QMRK__QMRK(col, null),
                             std.opt_QMRK__QMRK(src, null),
                             std.opt_QMRK__QMRK(chunk, null),
                             std.opt_QMRK__QMRK(name, null))
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function sm_node(ast,obj){
  const rc = obj || tnode();
  try{
    rc["source"] = ast.source;
    rc["column"] = ast.column;
    rc["line"] = ast.line;
  }catch(e){
    console.log("warning from sm_node()")
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Deal with possible destructuring of args in function definition
 * @private
 */
function dstruFuncArgs(args, env){
  let ret = [sm_node(args), sm_node(args)];
  let rval,
      out,
      pms=[],
      [fargs,fdefs]=ret;
  for(let e,i=0; i<args.length; ++i){
    rval = sm_node(args);
    out = sm_node(args);
    e=args[i];
    if(std.symbol_QMRK(e)){
      if(e != "&"){
        pms.push(e == "_" ? xfi(e, std.gensym("U__")) : e)
      }else{
        e = args[i+1]
        rval.add(`${ARRSLICE}(${JSARGS},${i})`);
        fdefs.add(["let ", txExpr(std.symbol_QMRK(e)?
                                  e:dstru(e,out,env),env), "=", rval, ";\n", out]);
        break;
      }
    }else if(Array.isArray(e)){
      rval.add(`${JSARGS}[${i}]`);
      pms.push(dstru(e, out, env));
      fdefs.add(out);
    }else{
      throwE("destruct-args", args)
    }
  }
  pms.forEach(a=> fargs.add(txExpr(a, env)));
  fargs.join(",");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Decide on what the rhs should be referred to 'as'
 * @private
 */
function dstru(coll, out, env){
  let rhs = std.gensym();
  for(let e,i=0; i<coll.length; ++i){
    e=coll[i];
    if(std.keyword_QMRK(e) && e == "as"){
      rhs = std.symbol(`${coll[i+1]}`);
      break;
    }
  }
  xfi(coll, rhs);
  out.add(std.map_QMRK(coll) ?
          dstruMap(rhs,coll,env) : std.vector_QMRK(coll) ? dstruVec(rhs,coll,env) : "");
  return rhs;
}
//////////////////////////////////////////////////////////////////////////////
/**Destruct a vec
 * @private
 */
function dstruVec(src, coll, env){
  let rval,out,
      ret = sm_node(coll),
      as = txExpr(src, env);
  for(let e,i=0; i<coll.length; ++i){
    rval = sm_node(coll);
    out = sm_node(coll);
    e = coll[i];
    if(std.symbol_QMRK(e)){
      if(e == "&"){
        e=coll[i+1];
        rval.add(`${ARRSLICE}(${as},${i})`);
        ret.add(["let ", txExpr(std.symbol_QMRK(e)?e:dstru(e,out,env),env), "=", rval, ";\n", out]);
        break;
      }else if(e != "_"){
        ret.add(["let ", txExpr(e, env), "=",
                 slib_BANG(GET_DASH_INDEX), "(", as, ",", `${i}`, ");\n"]);
      }
    }else if(Array.isArray(e)){
      rval.add(`${as}[${i}]`);
      ret.add(["let ", txExpr(dstru(e, out, env), env), "=", rval, ";\n", out]);
    }else if(std.keyword_QMRK(e)){
      if(e == "as")
        ++i;
      else
        throwE("unknown-keyword", coll);
    }else{
      throwE("syntax-error", coll)
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Destruct a map
 * @private
 */
function dstruMap(src, coll, env){
  let arr,
      ret = sm_node(coll),
      as = txExpr(src, env);
  for(let e,i=0; i<coll.length; i += 2){
    e=coll[i];
    if(std.keyword_QMRK(e)){
      if(e == "keys" || e == "strs"){
        for(let a,j=0, c2=coll[j+1]; j<c2.length; ++j){
          a= c2[j];
          ret.add(["let ", txExpr(a, env), "=",
                   slib_BANG(GET_DASH_PROP), "(", as, ",", std.quote_DASH_str(`${a}`), ");\n"]);
        }
      }else if(e == "as"){
      }else{
        throwE("unknown-keyword", coll)
      }
    }else{
      throwE("syntax-error", coll)
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Nothing complex
 * @private
 */
function isSimple(ast){
  return typeof(ast) == "undefined" ||
         ast === null ||
         typeof(ast)== "string" ||
         typeof(ast) == "number" || typeof(ast) == "boolean"
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
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
/**Flag the AST if it is an expression
 * @private
 */
function exprHint(ast, flag){
  let rc = isSimple(ast) ? new Primitive(ast) : ast;
  rc["____expr"] = flag;
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function isStmt(ast){
  if(isSimple(ast)) throwE("syntax-error", ast);
  return ast.____expr === false;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function throwE(e,ast,msg){
  throw Error([ERRORS_DASH_MAP.get(e),
               (msg ? ` : ${msg}` : null),
               (ast && typeof(ast.line) == "number") ? `\nline: ${ast.line}` : null,
               (ast && typeof(ast.source) == "string") ? `\nfile: ${ast.source}` : null].join(""))
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function fn_QMRK__QMRK(cmd){
  function t(re, x){ if(x) return re.test(x) }
  return t(rdr.REGEX.func, cmd) ? `(${cmd})` : cmd
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function pad(n){
  return " ".repeat(n)
}
//////////////////////////////////////////////////////////////////////////////
/**Process a file unit.  Sort out all the macros first then others.
 * Also, always check first for (ns ...)
 * @private
 */
function txTree(root, env){
  let ms = [],
      os = [],
      t,n1 = root[0],
      ret = sm_node(root);
  if(!Array.isArray(n1) ||
     !std.symbol_QMRK(n1[0]) || "ns" != n1[0])
    throw Error("(ns ...) must be first form in file");
  ms.push(n1);
  for(let i=0,rs=root.slice(1); i<rs.length; ++i){
    t= rs[i];
    (Array.isArray(t) &&
     std.symbol_QMRK(t[0]) &&
     "defmacro" == t[0] ? ms : os).push(t)
  }
  ms.concat(os).forEach(r=>{
    _STAR_last_DASH_line_STAR = r.line;
    _STAR_last_DASH_col_STAR = r.column;
    t = txExpr(r, env);
    typeof(t) == "undefined" || t === null ? null : ret.add([t, ";\n"]) });
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Transpile a form
 * @private
 */
function txForm(ast, env){
  let odd= ast.length % 2 !== 0;
  let ret= sm_node(ast);
  if(isAstMap(ast) || isAstObj(ast)){
    if(!odd) throw Error("map expected even args");
  }else if(isAstSet(ast)){
  }else if(isAstVec(ast)){
  }else if(ast.length>0){
    ast[0]=txExpr(ast[0]);
    ret=null;
  }
  for(let i=1;i<ast.length;++i){
    ast[i] = txExpr(ast[i], env)
  }
  if(isAstMap(ast)){
    for(let i=1;i<ast.length; i+=2){
      if(i>1)ret.add(",");
      ret.add(["[",ast[i],",",ast[i+1] ,"]"]);
    }
    ret=wrap(ret,"new Map([", "])");
  }else if(isAstSet(ast)){
    for(let i=1; i<ast.length; ++i){
      if(i>1) ret.add(","); ret.add(ast[i]) }
    ret=wrap(ret,"new Set([","])");
  }else if(isAstVec(ast)){
    for(let i=1; i<ast.length; ++i){
      if(i>1) ret.add(","); ret.add(ast[i]) }
    ret=wrap(ret,"[","]");
  }else if(isAstObj(ast)){
    for(let i=1;i<ast.length; i+=2){
      if(i>1)ret.add(",");
      ret.add([ast[i],":",ast[i+1]]);
    }
    ret=wrap(ret,"{", "}");
  }
  return ret ? ret : ast;
}
//////////////////////////////////////////////////////////////////////////////
/**Transpile an atom
 * @private
 */
function txAtom(a){
  let rc,
      s = `${a}`;
  if(a instanceof rdr.LambdaArg){
    rc=`${LARGS}[${parseInt(s.slice(1))-1}]`
  }else if(a instanceof std.RegexObj){
    rc=sm_node(a, tnodeEx(s, s.slice(1)))
  }else if(std.keyword_QMRK(a)){
    rc=sm_node(a, tnodeEx(s, std.quote_DASH_str(s)))
  }else if(std.symbol_QMRK(a)){
    rc=sm_node(a, tnodeEx(s, unmangle(s)))
  }else if(a===null){
    rc="null"
  }else if(a instanceof Primitive){
    a = a.value;
    s = `${a}`;
    rc=typeof(a) == "string" ?
                 std.quote_DASH_str(a) : a === null ? "null" : s;
  }else if(typeof(a) == "string"){
    rc= std.quote_DASH_str(a)
  }else{
    rc=rdr.jsid(s)
  }
  return rc
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function txExpr(x,env){
  let rc;
  if(Array.isArray(x)){
    if(std.vector_QMRK(x)){
      x.unshift(std.symbol("vector*"));
      xfi(x,x[0]);
      x.____list=1;
    }
    rc=txPairs(x, env)
  }else{
    rc=txAtom(x)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Maybe get the command
 * @private
 */
function gcmd(ast){
  return Array.isArray(ast) && !Array.isArray(ast[0]) ? `${ast[0]}` : ""
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function quoteSingle(a){
  let rc;
  if(std.keyword_QMRK(a)){
    rc=`${slib_BANG(KEYW)}("${a.value}")`
  }else if(std.symbol_QMRK(a)){
    rc=`${slib_BANG(SYMB)}("${a.value}")`
  }else if(a instanceof Primitive){
    a = a.value;
    rc=typeof(a) == "string" ?
       std.quote_DASH_str(a) : a === null ? "null" : `${a}`
  }else if(typeof(a) == "string"){
    rc=std.quote_DASH_str(a)
  }else{
    rc=`${a}`
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
/**Deal with quoting something
 * @private
 */
function quoteXXX(ast, env){
  return Array.isArray(ast) ? quoteBlock(ast,env) : quoteSingle(ast)
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function quoteMap(ast, env){
  let cma = "",
      ret = sm_node(ast);
  for(let i=0; i<ast.length; i += 2){
    if(i>0)
      ret.add(",");
    ret.add([quoteXXX(ast[i], env), " , ", quoteXXX(ast[i+1], env)]);
  }
  if(ast.length !== 0){
    cma = ","
  }
  return wrap(ret, ["[", slib_BANG(SYMB), `("hash-map")`, cma], "]")
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function quoteBlock(ast, env){
  let ret = sm_node(ast);
  for(let i=0; i<ast.length; ++i){
    if(i>0)
      ret.add(",");
    ret.add(quoteXXX(ast[i], env));
  }
  return wrap(ret, "[", "]");
}
////////////////////////////////////////////////////////////////////////////////
/** @private */
function spreadInfo(from, to){
  xfi(from, to);
  if(!isSimple(from) &&
     typeof(from.line) == "number" && Array.isArray(to)){
    to.forEach(z=> spreadInfo(from, z))
  }
}
//////////////////////////////////////////////////////////////////////////////
/**Deal with s-expr(list)
 * @private
 */
function txPairs(ast, env){
  let nsp = std.peek_DASH_nsp(), //current namespace
      stmtQ = isStmt(ast), //statement?
      ret = sm_node(ast),
      cmd = gcmd(ast), //potential func name
      e1 = ast[0],
      orig = ast,
      ecnt, op, tmp, mc = rt.getMacro(cmd);
  xfi(e1, ret);
  xfi(e1, ast);
  if(mc){
    //deal with a macro
    ast= rt.expand_QMRK__QMRK(ast, env, mc);
    ast= xfi(orig, exprHint(ast, !stmtQ));
    spreadInfo(orig, ast);
    cmd = gcmd(ast);
  }
  if(rdr.REGEX.int.test(cmd)){
    //(+1 x) => (+ x 1)
    if(cmd.startsWith("+") || cmd.startsWith("-")){}else{
      cmd= `+${cmd}`
    }
    ast = xfi(ast, [std.symbol(cmd[0]), ast[1], parseInt(cmd.slice(1))]);
    cmd = `${ast[0]}`;
  }
  //check if special op
  op = std.getProp(SPEC_DASH_OPS, cmd);
  if(cmd == "with-meta"){
    ret.add(txExpr(isTaggedMeta(ast, env)[1], env))
  }else if(cmd.startsWith(".-")){
    //object property access
    ret.add([txExpr(ast[1], env), ".", txExpr(std.symbol(cmd.slice(2)), env)])
  }else if(cmd.startsWith(".@")){
    //array index access (.@i v) => v[i], (.@+i v) => v[i+1]
    ret.add([txExpr(ast[1], env), "[",
             cmd.slice(cmd.startsWith(".@+") ? 3 : 2),cmd.startsWith(".@+") ? "+1" : "", "]"])
  }else if(cmd.startsWith(".")){
    //(.foo obj p1 p2 p3)
    //deal with parameters
    let pms = [];
    for(let i=0,GS__27 = ast.slice(2); i< GS__27.length; ++i){
      pms.push(txExpr(GS__27[i], env))
    }
    //generates obj.foo(p1,p2,p3)
    ret.add([txExpr(ast[1], env), txExpr(std.symbol(cmd), env)].concat("(", pms.join(",") , ")"))
  }else if(op){
    //run spec op
    ret = op(ast, env)
  }else if((cmd == "splice-unquote" ||
            cmd == "unquote" ||
            cmd == "syntax-quote") && !std.getProp(nsp, "id").startsWith(KBPFX)){
    throwE("outside-macro", ast)
  }else{
    ecnt=std.pairs_QMRK(ast)?ast.length:1;
    if(ecnt==2 && isAstMap(ast[1]) && (std.keyword_QMRK(ast[0]) ||
                                       typeof(ast[0])=="string")){
      cmd=slib_BANG(`${KBSTDLR}.getProp`);
      ret.add([cmd,"(", txExpr(ast[1]), ",", txExpr(ast[0]), ")"]);
    }else if(ecnt==2 && isAstMap(ast[0]) && (std.keyword_QMRK(ast[1]) ||
                                             typeof(ast[1])=="string")){
      cmd=slib_BANG(`${KBSTDLR}.getProp`);
      ret.add([cmd,"(", txExpr(ast[0]), ",", txExpr(ast[1]), ")"]);
    }else{
      cmd=null;
      if(std.pairs_QMRK(ast)){
        if(ecnt>0) cmd= txForm(ast,env)[0];
      }else{
        cmd=txExpr(ast,env)
      }
      if(!cmd)
        throwE("empty-form", ast);
      cmd = slib_BANG(cmd);
      ret.add(std.pairs_QMRK(ast) ? [fn_QMRK__QMRK(cmd), "(", ast.slice(1).join(","), ")"] : cmd);
    }
  }
  return sm_node(ast, ret);
}
//////////////////////////////////////////////////////////////////////////////
//Convert to jsdoc
function writeDoc(doc){
  return (doc ? std.split(std.unquote_DASH_str(doc), "\n") : []).map(a=>{
    let s = [a].join("").trim();
    return std.not_DASH_empty(s) ? `//${s}\n` : null;
  }).filter(a=> std.not_DASH_empty(a))
}
//////////////////////////////////////////////////////////////////////////////
//A Do block
function txDo(ast, env,ret_Q){
  let stmtQ = isStmt(ast),
      ret = sm_node(ast),
      e, end = ast.length - 1;

  ret_Q = stmtQ ? false : std.opt_QMRK__QMRK(ret_Q, true);
  for(let i=0; i<end; ++i)
    ret.add([txExpr(exprHint(ast[i], false), env), ";\n"])

  if(end >= 0){
    e = txExpr(exprHint(ast[end], !stmtQ), env);
    ret.add(!ret_Q ? [e, ";\n"] : ["return ", e, ";\n"]);
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
function isWithMeta(obj){
  return Array.isArray(obj) && 3 === obj.length &&
         std.symbol_QMRK(obj[0]) && "with-meta" == `${obj[0]}`
}
//////////////////////////////////////////////////////////////////////////////
function isTaggedMeta(obj, env){
  let rc;
  if(!isWithMeta(obj)){
    rc=[null, obj];
  }else{
    let [X,e2,m3]=obj;
    e2["____meta"] = evalMeta(m3, env);
    rc= [e2.____meta, e2];
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function fmtSpecOps(fname, attrs){
  let out = (std.getProp(attrs, "opcode") || []).map(a=>
    `${rdr.jsid("SPEC-OPS")}[${std.quote_DASH_str(a)}]=${fname}`).join(";\n");
  return std.count(out) > 0 ? [out, ";\n"].join("") : "";
}
//////////////////////////////////////////////////////////////////////////////
function writeFuncPre(pre, env){
  let ret = sm_node(pre);
  let c2 = [std.symbol("if-not"),
            [std.symbol("and")].concat(pre),
            [std.symbol("throw"), [std.symbol("Error"), "Precondition failed"]]];
  return ret.add([txExpr(exprHint(c2, false), env), ";\n"]);
}
//////////////////////////////////////////////////////////////////////////////
function writeFuncInfo(fname, ast){
  let file = ast.source ? ast.source.slice(ast.source.lastIndexOf("/") + 1) : "?";
  let s = `//fn: [${fname}] in file: ${file}, line: ${ast.line || "?"}\n`;
  let len = s.length;
  if(len < 80){ len = 80 }
  return ["/".repeat(len), "\n", s].join("");
}
//////////////////////////////////////////////////////////////////////////////
function evalMeta(ast, env){
  let rc=ast;
  if(std.keyword_QMRK(ast)){
    rc=new Map();
    rc.set(ast,true);
  }else if(std.symbol_QMRK(ast)){
    rc=new Map();
    rc.set(std.keyword(":tag"), ast);
  }else if(!Array.isArray(ast)){
    throwE("invalid-meta", ast)
  }
  return rt.compute(rc,env);
}
//////////////////////////////////////////////////////////////////////////////
/**Maybe strip out kirbyref
 * @private
 */
function slib_BANG(cmd){
  let lib = `${KBSTDLR}.`,
      nsp = std.peek_DASH_nsp();
  cmd = `${cmd}`;
  return cmd.startsWith(lib) &&
         std.getProp(nsp, "id") == KBSTDLIB ? cmd.slice(lib.length) : cmd
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function assertArity(kond, ast){
  if(!kond)
    throwE("invalid-arity", ast);
  return assertInfo(ast);
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function assertInfo(ast){
  if(false && ast && !isSimple(ast) && typeof(ast.line) != "number"){
    throwE("no-sourcemap-info", ast)
  }
}
//////////////////////////////////////////////////////////////////////////////
/**Load in all the exported macros from the external lib
 * @private
 */
function loadRLib(info, env){
  let {ns, vars, macros} = info;
  function loop(v, k){
    let ast = rt.readAST(v),
        s = std.symbol(`${ns}/${ast[1]}`);
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
          vs.reduce((x,y)=> x.add(y), new Set())]
}
//////////////////////////////////////////////////////////////////////////////
function isPub(ast){
  return ! `${Array.isArray(ast) ? ast[0] : ast}`.endsWith("-")
}
//////////////////////////////////////////////////////////////////////////////
//Takes a set of functions and returns a fn that is the juxtaposition
//of those fns.  The returned fn takes a variable number of args, and
//returns a vector containing the result of applying each fn to the
//args (left-to-right).
//((juxt a b c) x) => [(a x) (b x) (c x)]
function sf_DASH_juxt(ast, env){
  let ret = sm_node(ast);
  for(let i=0,GS__37 = ast.slice(1),sz=GS__37.length; i<sz; ++i){
    if(i>0)
      ret.add(",");
    ret.add([txExpr(GS__37[i], env),"(...", LARGS, ")"]);
  }
  return wrap(ret, ["function(...",LARGS,"){\nreturn ["], "];\n}")
}
SPEC_DASH_OPS["juxt"] = sf_DASH_juxt;
//////////////////////////////////////////////////////////////////////////////
//Returns an atom's current state.
function sf_DASH_deref(ast, env){
  assertArity(ast.length === 2, ast);
  return sm_node(ast).add([txExpr(ast[1], env), ".value"])
}
SPEC_DASH_OPS["deref"] = sf_DASH_deref;
////////////////////////////////////////////////////////////////////////////////
//Takes a set of functions and returns a fn that is the composition
//of those fns.  The returned fn takes a variable number of args,
//applies the rightmost of fns to the args, the next
//fn (right-to-left) to the result, etc.
function sf_DASH_compose(ast, env){
  assertArity(ast.length >= 2, ast);
  let last="",
      ret = sm_node(ast);
  for(let a,i=1,end = ast.length; i<end; ++i){
    last+=")";
    ret.add([txExpr(ast[i],env),"("]);
  }
  return wrap(ret, ["function(...",LARGS,"){\nreturn "], ["...",LARGS,last,";\n", "}"]);
}
SPEC_DASH_OPS["comp"] = sf_DASH_compose;
//////////////////////////////////////////////////////////////////////////////
//Returns the unevaluated form
function sf_DASH_quote(ast, env){
  assertArity(ast.length === 2, ast);
  return wrap(sm_node(ast), null, quoteXXX(ast[1], env));
}
SPEC_DASH_OPS["quote"] = sf_DASH_quote;
//////////////////////////////////////////////////////////////////////////////
//Define a Class
function sf_DASH_deftype(ast, env){
  assertArity(ast.length >= 3, ast);
  if(!std.symbol_QMRK(ast[1])) throwE("syntax-error", ast[1], "no class name");
  if(!std.vector_QMRK(ast[2])) throwE("syntax-error", ast[2], "no parent class");
  let pub_Q= isPub(ast),
      par = ast[2][0],
      czn = ast[1],
      ret = sm_node(ast),
      czname = txExpr(czn, env),
      [doc,mtds] = isStr(ast[3]) ? [ast[3], ast.slice(4)] : [null, ast.slice(3)];
  rt.addVar(czn, new Map([["ns", std._STAR_ns_STAR()]]));
  ret.add([`class ${czname}`, (par ? ` extends ${txExpr(par, env)}` : ""), "{\n"]);
  for(let m1,mtd,m,i=0, sz=mtds.length; i<sz; ++i){
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
  if(pub_Q){
    _STAR_vars_STAR.push(czn);
    _STAR_externs_STAR.set(czname, czname);
  }
  return ret.add("}\n");
}
SPEC_DASH_OPS["deftype"] = sf_DASH_deftype;
SPEC_DASH_OPS["deftype-"] = sf_DASH_deftype;
//////////////////////////////////////////////////////////////////////////////
//Handle comparison operators.
function sf_DASH_compOp(ast, env){
  //assertArity(ast.length >= 3 && isOdd(ast.length), ast);
  let op,
      cmd = `${ast[0]}`,
      ret = sm_node(ast);
  if(cmd == "not="){
    ast[0] = std.symbol("!==")
  }else if(cmd == "="){
    ast[0] = std.symbol("===")
  }
  op = `${ast[0]}`;
  for(let i=1, end=ast.length-1; i<end; ++i){
    if(i !== 1)
      ret.add(" && ");
    ret.add([txExpr(ast[i], env), " ", op, " ", txExpr(ast[i+1], env)]);
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
  assertArity(ast.length >= 2, ast);
  let cmd,
      e1 = `${ast[0]}`,
      ret = sm_node(ast);
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
    ret.add([MODLO, "(", txExpr(ast[1], env), ",", txExpr(ast[2], env), ")"]);
  }else if("~" == cmd){
    ret.add(["~", txExpr(ast[1], env)]);
  }else{
    if("-" == cmd && 2 === ast.length){
      ret.add("-1 * ");
    }
    for(let i=1,end = ast.length; i<end; ++i){
      if(ast.length > 2 && i>1) ret.add(` ${cmd} `);
      ret.add(txExpr(ast[i], env))
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
  let ret = sm_node(ast),
      stmtQ = isStmt(ast);
  ret.add(txDo(exprHint(xfi(ast, ast.slice(1)), !stmtQ), env, !stmtQ));
  return stmtQ ? wrap(ret, "if (true) {\n", "\n}\n")
               : wrap(ret, "(function() {\n", "}).call(this)")
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
  assertArity(ast.length >= 4, ast);
  let stmtQ = isStmt(ast),
      ret = sm_node(ast),
      tst = ast[1],
      ms="",
      brk = ";\nbreak;\n",
      mv= `${std.gensym("M__")}`,
      gs= `${std.gensym("C__")}`,
      dft = isOdd(ast.length) ? ast.pop() : null;
  if(!dft){
    ms= `${mv}=true;\n`
  }
  for(let c,i = 2, sz = ast.length; i<sz; i+=2){
    c = txExpr(ast[i+1], env);
    if(std.pairs_QMRK(ast[i])){
      for(let c2 = ast[i], j=0, end=c2.length; j<end; ++j)
        ret.add(["case ", txExpr(c2[j], env), ":\n",
                 j === (c2.length-1) ? `${ms}${gs}=${c}${brk}` : ""]);
    }else{
      ret.add(["case ", txExpr(ast[i], env), ":\n", ms,gs, "=", c, brk])
    }
  }
  if(dft)
    ret.add(["default:\n", gs, "=", txExpr(dft, env), brk]);
  wrap(ret, ["switch (", txExpr(tst, env), ") {\n"], "}");
  if(!dft){
    ret.add(`if(!${mv}){throw Error("IllegalArgumentException")}\n`)
  }
  return (stmtQ ?
    wrap(ret, `let ${gs},${mv};\n`, "") :
    wrap(ret, `(function(){let ${gs},${mv};\n`, ["return ", gs, ";}).call(this)"].join("")));
}
SPEC_DASH_OPS["case"] = sf_DASH_case;
//////////////////////////////////////////////////////////////////////////////
/**Not used, let is a macro
 * @private
 */
function sf_DASH_let(ast, env){
  let stmtQ = isStmt(ast),
      [e1,e2]=ast,
      ret = sm_node(ast);
  ast[0] = xfi(e1, std.symbol("do"));
  std.cons_BANG(xfi(e2, std.symbol("vars")), e2);
  return sf_DASH_do(ast, env);
}
SPEC_DASH_OPS["letx"] = sf_DASH_let;
//////////////////////////////////////////////////////////////////////////////
//Creates a variable with an initial value
function sf_DASH_var(ast, env){
  assertArity(isOdd(ast.length), ast);
  let vs = [],
      cmd = `${ast[0]}`,
      keys = new Map(),
      ret = sm_node(ast),
      pub_Q= cmd == "def" || cmd == "const";
  cmd = cmd.startsWith("const") ? "const" : cmd == "locals" || cmd == "vars" ? "let" : "var";
  for(let i=1,end = ast.length; i<end; i+=2){
    let lhs = ast[i];
    let rhs = ast[i+1];
    let out = sm_node(ast);
    let x = undefined;
    let rval = txExpr(rhs, env);
    if(std.symbol_QMRK(lhs)){
      x = lhs;
      lhs = txExpr(lhs, env);
      if("let" != cmd)
        rt.addVar(`${x}`, new Map([["ns", std._STAR_ns_STAR()]]));
      keys.set(lhs, lhs);
      vs.push(`${x}`);
      ret.add([cmd, " ", lhs, "=", rval, ";\n"]);
    }else{
      ret.add(["let ", txExpr(dstru(lhs, out, env), env), "=", rval, ";\n", out]);
    }
  }
  if(pub_Q){
    vs.forEach(a=> _STAR_vars_STAR.push(a));
    function GS__45(v,k){
      _STAR_externs_STAR.set(k,v)
    }
    if(std.object_QMRK(keys)){
      Object.keys(keys).forEach(p=> GS__45(std.getProp(keys, p), p))
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
  assertArity(ast.length === 3, ast);
  return wrap(sm_node(ast), null, ["(", txExpr(ast[2], env), " instanceof ", txExpr(ast[1], env), ")"]);
}
SPEC_DASH_OPS["inst?"] = sf_DASH_inst_QMRK;
//////////////////////////////////////////////////////////////////////////////
//Delete an object or property of an object.
function sf_DASH_delete(ast, env){
  assertArity(ast.length >= 2 && ast.length < 4, ast);
  let ret = sm_node(ast);
  ret.add(["delete ", txExpr(ast[1], env)]);
  if(ast.length > 2)
    ret.add(["[", txExpr(ast[2], env), "]"]);
  return ret;
}
SPEC_DASH_OPS["delete!"] = sf_DASH_delete;
//////////////////////////////////////////////////////////////////////////////
//Remove a key from Map.
function sf_DASH_dissoc_BANG(ast, env){
  //assertArity(ast.length === 3, ast);
  let ret=sm_node(ast);
  for(let i=2;i<ast.length;++i){
    ret.add(",");
    ret.add(txExpr(ast[i],env));
  }
  return wrap(ret, [slib_BANG(`${KBSTDLR}.${txExpr(std.symbol("dissoc!"), env)}`), "(", txExpr(ast[1], env)], ")");
}
SPEC_DASH_OPS["dissoc!"] = sf_DASH_dissoc_BANG;
//////////////////////////////////////////////////////////////////////////////
//The args, if any, are evaluated from left to right,
//and passed to the constructor of the class
//named by Classname. The constructed object is returned.
//e.g.
//(new Error 'a' 3)
function sf_DASH_new(ast, env){
  assertArity(ast.length >= 2, ast);
  return wrap(sm_node(ast), "new ", txExpr(xfi(ast, ast.slice(1)), env));
}
SPEC_DASH_OPS["new"] = sf_DASH_new;
//////////////////////////////////////////////////////////////////////////////
//Throw an exception
function sf_DASH_throw(ast, env){
  assertArity(ast.length === 2, ast);
  let ret = sm_node(ast),
      stmtQ = isStmt(ast);
  ret.add(["throw ", txExpr(xfi(ast, ast[1]), env)]);
  if(!stmtQ)
    wrap(ret, "(function (){ ", ";}).call(this)");
  return ret;
}
SPEC_DASH_OPS["throw"] = sf_DASH_throw;
//////////////////////////////////////////////////////////////////////////////
//Unary operator for increment & decrement
function sf_DASH_x_DASH_opop(ast, env){
  assertArity(ast.length === 2, ast);
  let cmd = `${ast[0]}`,
      a2 = txExpr(ast[1], env);
  return sm_node(ast).add(cmd.endsWith("$") ? [a2, cmd.slice(0, -1)] : [cmd, a2]);
}
SPEC_DASH_OPS["++"] = sf_DASH_x_DASH_opop;
SPEC_DASH_OPS["--"] = sf_DASH_x_DASH_opop;
SPEC_DASH_OPS["++$"] = sf_DASH_x_DASH_opop;
SPEC_DASH_OPS["--$"] = sf_DASH_x_DASH_opop;
//////////////////////////////////////////////////////////////////////////////
//Compound assignment operators
function sf_DASH_x_DASH_eq(ast, env){
  assertArity(ast.length === 3, ast);
  let cmd,a0 = `${ast[0]}`;
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
  return wrap(sm_node(ast), "(", [txExpr(ast[1], env), " ", cmd, " ", txExpr(ast[2], env), ")"])
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
  assertArity(isEven(ast.length), ast);
  let ret = sm_node(ast),
      obj = txExpr(ast[1], env);
  for(let i=2;i<ast.length;++i){
    ret.add(",");
    ret.add(txExpr(ast[i],env));
  }
  return wrap(ret, [slib_BANG(`${KBSTDLR}.${txExpr(std.symbol("assoc!"), env)}`), "(", txExpr(ast[1], env)], ")");
}
SPEC_DASH_OPS["assoc!"] = sf_DASH_assoc_BANG;
//////////////////////////////////////////////////////////////////////////////
//Object property assignment or array index setter.
function sf_DASH_assign_BANG(ast, env){
  assertArity(isEven(ast.length), ast);
  let ret = sm_node(ast),
      obj = txExpr(ast[1], env);
  for (let a,i=2,end = ast.length; i<end; i+=2){
    a= ast[i];
    if(i>2)
      ret.add(",");
    ret.add([obj, "[", txExpr(xfi(ast, a), env), "]", "=", txExpr(xfi(ast, ast[i+1]), env)])
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS["oset!"] = sf_DASH_assign_BANG;
SPEC_DASH_OPS["aset"] = sf_DASH_assign_BANG;
//////////////////////////////////////////////////////////////////////////////
//Set value(s) to variable(s).
//e.g. (set! a 2 b 4 ...)
function sf_DASH_set(ast, env){
  assertArity(isOdd(ast.length), ast);
  let ret = sm_node(ast);
  for(let i=1,end = ast.length; i<end; i+=2){
    if(i>1)
      ret.add(",");
    ret.add([txExpr(ast[i], env), "=", txExpr(xfi(ast, ast[i+1]), env)]);
  }
  return wrap(ret, "(", ")");
}
SPEC_DASH_OPS["set!"] = sf_DASH_set;
SPEC_DASH_OPS["var-set"] = sf_DASH_set;
//////////////////////////////////////////////////////////////////////////////
//Defines an anonymous function. See defn.
//(fn attrs? [x y] ...)
function sf_DASH_fn(ast, env){
  assertArity(ast.length >= 2, ast);
  let body = xfi(ast, ast.slice(2)),
      [X,args]= isTaggedMeta(ast[1], env);
  if(!Array.isArray(args))
    throwE("invalid-fargs", ast);
  let fargs = dstruFuncArgs(xfi(ast, args), env);
  return wrap(sm_node(ast), null, ["function(", fargs[0], "){\n", fargs[1], txDo(body, env, true), "}"]);
}
SPEC_DASH_OPS["fn"] = sf_DASH_fn;
//////////////////////////////////////////////////////////////////////////////
//Defines a function. Use defn- to indicate privacy (no export).
//(defn name doc-string? attr-map? [params*] ...)
function sf_DASH_func(ast, env){
  assertArity(ast.length >= 2, ast);
  let mtd_Q= `${ast[0]}` == "method",
      pub_Q= isPub(ast),
      fname0 = `${ast[1]}`,
      fname = `${txExpr(ast[1], env)}`,
      dot_Q = fname.includes("."),
      ret = sm_node(ast, tnodeEx(fname)),
      [doc,pargs] = isStr(ast[2]) ? [ast[2], 3] : [null, 2],
      body = xfi(ast, ast.slice(pargs+1)),
      b1 = body[0],
      [attrs,args] = isTaggedMeta(ast[pargs], env);

  if(!std.vector_QMRK(args)) throwE("invalid-fargs", ast);
  if(!mtd_Q)
    rt.addVar(fname0, new Map([["ns", std._STAR_ns_STAR()]]));
  let pre,post,fargs = dstruFuncArgs(xfi(ast, args), env);
  attrs = attrs || new Map();
  if(std.map_QMRK(b1)){
    for(let e2,e,i = 0, end = b1.length; i<end; i+=2){
      e = b1[i];
      e2 = b1[i+1];
      if(std.keyword_QMRK(e) && Array.isArray(e2)){
        if(e == "post"){
          post = e2
        }else if(e == "pre"){
          pre = e2
        }
      }
    }
  }
  if(mtd_Q){
    if(attrs.get("static"))
      ret.add("static ");
    ret.add(`${fname} (`);
    if(fname == "constructor")
      body.push(std.symbol("this"));
  }else if(dot_Q){
    ret.add(`${fname} = function (`)
  }else{
    ret.add(`const ${fname} = function (`)
  }
  ret.add([fargs[0], ") {\n", fargs[1]]);
  if(pre || post){
    body = body.slice(1);
    let www=writeFuncPre(xfi(ast, pre), env);
    ret.add(www);
  }
  ret.add([txDo(body, env, true), "};\n"]);
  if(std.not_DASH_empty(attrs))
    ret.add(fmtSpecOps(fname, attrs));
  if(doc)
    ret.prepend(writeDoc(doc));
  if(pub_Q && !dot_Q && !mtd_Q){
    _STAR_vars_STAR.push(fname0);
    _STAR_externs_STAR.set(fname, fname);
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
  assertArity(ast.length >= 2, ast);
  let sz = ast.length,
      f = std.last(ast),
      ret = sm_node(ast),
      c,t,stmtQ = isStmt(ast);
  if(Array.isArray(f) && `${f[0]}` == "finally"){
    ast.pop();
    sz = ast.length;
    xfi(f[0], f);
  }else{
    f = null
  }
  c = null;
  if(sz > 1)
    c = ast[sz-1];
  if(Array.isArray(c) && `${c[0]}` == "catch"){
    if(c.length < 2 ||
       !std.symbol_QMRK(c[1]))
      throwE("invalid-catch", ast);
    ast.pop();
    xfi(c[0], c);
  }else{
    c = null
  }
  if(f === null &&
     c === null)
    throwE("invalid-try", ast);
  ret.add(["try{\n", txDo(exprHint(xfi(ast, ast.slice(1)), !stmtQ), env), "\n}"]);
  if(c){
    t = c[1];
    ret.add(["catch(", txExpr(t, env), "){\n",
             txDo(exprHint(xfi(c, c.slice(2)), !stmtQ), env), ";\n}\n"]);
  }
  if(f)
    ret.add(["finally{\n", txDo(exprHint(xfi(f, f.slice(1)), false), env, false), ";\n}\n"]);
  if(!stmtQ)
    wrap(ret, "(function(){\n", "}).call(this)");
  return ret;
}
SPEC_DASH_OPS["try"] = sf_DASH_try;
//////////////////////////////////////////////////////////////////////////////
//Evaluates test. If truthy evaluates 'then' otherwise 'else'.
//(if test then else)
//(if test then)
function sf_DASH_if(ast, env){
  assertArity(ast.length >= 3, ast);
  let stmtQ = isStmt(ast),
      ret = sm_node(ast),
      a1 = exprHint(xfi(ast, ast[1]), true),
      a2 = exprHint(xfi(ast, ast[2]), !stmtQ),
      m_Q= ast.length > 3,
      a3 = m_Q ? xfi(ast, ast[3]) : null,
      elze = m_Q ? exprHint(a3, !stmtQ) : null;

  a1 = txExpr(a1, env);
  a2 = txExpr(a2, env);
  elze = txExpr(elze, env);

  return wrap(ret, null, stmtQ ?
    ["if(", a1, "){\n", a2, ";\n}",m_Q ? `else{\n${elze}\n}` : ""] :
    ["(", a1, " ?\n", a2, " :\n",(elze || "null"), ")"])
}
SPEC_DASH_OPS["if"] = sf_DASH_if;
//////////////////////////////////////////////////////////////////////////////
//Returns the named property of an object,
//or value at the index of an array.
//(get obj "age")
//(aget obj 4)
//(nth obj 3)
function sf_DASH_get(ast, env){
  assertArity(ast.length === 3, ast);
  let ret = sm_node(ast),
      a0 = `${ast[0]}`,
      cmd = slib_BANG(GET_DASH_PROP);
  return a0 != "get" ?
    wrap(ret, null, [txExpr(xfi(ast, ast[1]), env), "[", txExpr(xfi(ast, ast[2]), env), "]"]) :
    wrap(ret, null, [cmd, "(", txExpr(xfi(ast, ast[1]), env), ",", txExpr(xfi(ast, ast[2]), env), ")"]);
}
SPEC_DASH_OPS["oget"] = sf_DASH_get;
SPEC_DASH_OPS["nth"] = sf_DASH_get;
SPEC_DASH_OPS["get"] = sf_DASH_get;
SPEC_DASH_OPS["aget"] = sf_DASH_get;
//////////////////////////////////////////////////////////////////////////////
//Creates a new list containing the args.
//(list "hello" "world")
//(list 1 2 3)
//[1 2 3]
//["hello" "world"]
function sf_DASH_list(ast, env){
  assertArity(true, ast);
  let a0=ast[0],
      a0s=`${a0}`,
      ret = sm_node(ast);
  ast = ast.slice(1);
  for(let i=0, sz = ast.length; i<sz; ++i){
    ret.add(txExpr(xfi(ast, ast[i]), env));
  }
  ret.join(",");
  return wrap(ret, [slib_BANG(`${KBSTDLR}.list`),"("],")");
}
SPEC_DASH_OPS["list"] = sf_DASH_list;
SPEC_DASH_OPS["list*"] = sf_DASH_list;
//////////////////////////////////////////////////////////////////////////////
//Creates a new vector containing the args.
//(vec "hello" "world")
//(vec 1 2 3)
//[1 2 3]
//["hello" "world"]
function sf_DASH_array(ast, env){
  assertArity(true, ast);
  let a0=ast[0],
      a0s=`${a0}`,
      ret = sm_node(ast);
  ast = ast.slice(1);
  for(let i=0, sz = ast.length; i<sz; ++i){
    if(i>0)ret.add(",");
    ret.add(txExpr(xfi(ast, ast[i]), env));
  }
  return wrap(ret, "[", "]");
}
SPEC_DASH_OPS["vector"] = sf_DASH_array;
SPEC_DASH_OPS["vector*"] = sf_DASH_array;
//////////////////////////////////////////////////////////////////////////////
//Returns a new object with supplied key-mappings.
//(object "a" 1 "b" 2)
//{:a 1 :b 2}
function sf_DASH_objObj(ast, env){
  assertArity(true, ast);
  let a0=ast[0],
      a0s=`${a0}`,
      ret = sm_node(ast);
  ast = ast.slice(1);
  for(let i=0,end = ast.length; i<end; i += 2){
    if(i>0)ret.add(",");
    ret.add([txExpr(ast[i], env), " : ", txExpr(xfi(ast, ast[i+1]), env)]);
  }
  return wrap(ret, "{", "}");
}
SPEC_DASH_OPS["object*"] = sf_DASH_objObj;
SPEC_DASH_OPS["object"] = sf_DASH_objObj;
SPEC_DASH_OPS["js-obj"] = sf_DASH_objObj;
//////////////////////////////////////////////////////////////////////////////
function sf_DASH_mapObj(ast, env){
  assertArity(true, ast);
  let ret = sm_node(ast);
  ast = ast.slice(1)
  for(let i=0,end = ast.length; i < end; i += 2){
    if(i>0)ret.add(",");
    ret.add(["[", txExpr(ast[i], env), ",", txExpr(xfi(ast, ast[i+1]), env), "]"]);
  }
  return wrap(ret, "new Map([", "])");
}
SPEC_DASH_OPS["hash-map"] = sf_DASH_mapObj;
SPEC_DASH_OPS["hashmap*"] = sf_DASH_mapObj;
//////////////////////////////////////////////////////////////////////////////
//Returns a new Set.
//(set 1 2 3)
function sf_DASH_setObj(ast, env){
  assertArity(true, ast);
  let ret = sm_node(ast);
  ast = ast.slice(1);
  for(let i=0,sz=ast.length; i<sz; ++i){
    if(i>0)ret.add(",");
    ret.add(txExpr(ast[i], env));
  }
  return wrap(ret, "new Set([", "])");
}
SPEC_DASH_OPS["hash-set"] = sf_DASH_setObj;
SPEC_DASH_OPS["hashset*"] = sf_DASH_setObj;
//////////////////////////////////////////////////////////////////////////////
function requireJS(path){
  try{
    return require(path)
  }catch(e){
    println("warning: failed to load lib: ", path)
  }
}
//////////////////////////////////////////////////////////////////////////////
function requireEx(ret, fdir, ast, env){
  let used, rlib,
      mcs, nsp,
      vvv, info,
      libpath,
      refers, renames,
      rpath = `${ast[0]}`,
      as = `${std.gensym("R__")}`;

  if(std.symbol_QMRK(rpath))
    rpath = std.quote_DASH_str(`${rpath}`);

  for(let v1,v,j=1, end = ast.length; j<end; j += 2){
    v = ast[j];
    v1=ast[j+1];
    if("as" == v){
      as = `${v1}`
    }else if("refer" == v){
      refers = v1
    }else if("rename" == v){
      renames = v1
    }
  }
  libpath = txExpr(rpath.includes("./") ? path.resolve(fdir, rpath) : rpath, env);
  ret.add(["const ", rdr.jsid(as), "= require(", txExpr(rpath, env), ");\n"]);
  rlib = requireJS(std.unquote_DASH_str(libpath));
  if(rlib)
    info = std.getProp(rlib, EXPKEY);
  rt.addLib(`${as}`, rlib);
  if(info){
    mcs = std.getProp(info, "macros");
    vvv = loadRVars(info, env);
    nsp = loadRLib(info, env);
  }
  mcs = mcs || new Map();
  vvv = vvv || [];
  used = new Set();
  nsp = nsp || "";
  if(std.keyword_QMRK(refers) && vvv && refers == "all"){
    refers = vvv[0]
  }
  renames=renames||[];
  for(let i=0, end = renames.length; i < end; i += 2){
    let ro = renames[i],
        rn = renames[i+1],
        ev = `${ro}`,
        rs = `${rn}`;
    if(info){
      if(std.getProp(mcs, ev) || std.contains_QMRK(vvv[1], ev)){}else{
        throw new Error(`Unknown var: '${ev}'`)
      }
      if(std.getProp(mcs, rs) || std.contains_QMRK(vvv[1], rs))
        throw new Error(`Cannot rename var: '${ev}' to existing var: '${rs}'`)
    }
    rt.addVar(rs, new Map([["ns", nsp]]));
    used.push(ev);
    ret.add(["const ", txExpr(rn, env), "=", as, "[\"", txExpr(ro, env), "\"];\n"])
  }
  refers=refers||[];
  for(let i=0, end=refers.length; i<end; ++i){
    let r = refers[i],
        rs = `${r}`,
        v = txExpr(r, env);
    if(!std.contains_QMRK(used, rs)){
      if(info){
        if(std.getProp(mcs, rs) || std.contains_QMRK(vvv[1], rs)){}else{
          throw new Error(`Unknown var: '${rs}'`)
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
  assertArity(ast.length >= 2, ast);
  let ret = sm_node(ast),
      fdir = path.dirname(ast.source);
  for(let a,i = 0, GS__59 = ast.slice(1), sz = GS__59.length; i<sz; ++i){
    a= GS__59[i];
    if(Array.isArray(a) && (std.symbol_QMRK(a[0]) || typeof(a[0]) == "string")){}else{
      throwE("invalid-require", ast)
    }
    requireEx(ret, fdir, a, env);
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//(ns name doc-string? attr-map? references*)
//Creates a namespace, references can be zero or more of:
//(:require ...)
//(ns ^{:doc "some doc"} hello.world.core ...)
function sf_DASH_ns(ast, env){
  assertArity(ast.length >= 2, ast);
  let ret = [],
      pos = 2,
      doc, e, mobj,
      [attrs,nsp] = isTaggedMeta(ast[1], env);
  if(!std.symbol_QMRK(nsp))
    throwE("invalid-namespace", ast);
  if(typeof(ast[pos]) == "string"){
    attrs = attrs || new Map();
    attrs.set("doc", ast[pos]);
    ++pos;
  }
  if(std.map_QMRK(ast[pos])){
    mobj = evalMeta(ast[pos], env);
    attrs = std.merge(attrs, mobj);
    ++pos;
    nsp["____meta"] = attrs;
  }
  std.push_DASH_nsp(`${nsp}`, attrs);
  ast = xfi(ast, ast.slice(pos));
  for(let e,i = 0, sz =ast.length; i<sz; ++i){
    e = ast[i];
    if(std.pairs_QMRK(e) &&
       std.keyword_QMRK(e[0]) &&
       `${e[0]}` == "require")
      ret.push(sf_DASH_require(xfi(ast, e), env))
  }
  nsp = std._STAR_ns_STAR();
  if(nsp == `${KBPFX}stdlib`){}else{
    if(nsp.startsWith(KBPFX)){
      ret.push(`const ${KBSTDLR}=std;\n`)
    }else{
      ret.push(sf_DASH_require(xfi(ast, [std.keyword("require"),
                                         ["kirby", std.keyword(":as"),
                                         std.symbol("kirbystdlibref")]]), env));
    }
  }
  ret.push(["const ", std.MODULE_NAMESPACE, "= ", std.quote_DASH_str(nsp), ";\n"].join(""));
  return ret;
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
  assertArity(ast.length >= 2, ast);
  let stmtQ = isStmt(ast),
      ret = sm_node(ast),
      body = exprHint(xfi(ast, ast.slice(2)), false);
  return body.length===0 ? ret : sf_DASH_wloop(ret, ast[1], body, env, stmtQ)
}
SPEC_DASH_OPS["while"] = sf_DASH_while;
//////////////////////////////////////////////////////////////////////////////
//For loop implementation
function sf_DASH_wloop(ret, tst, body, env, stmtQ){
  let nb = [std.symbol("not"), std.symbol("____break")];
  ret.add("for(let ____break=false; ");
  xfi(ret, nb);
  tst = [std.symbol("and"), nb, tst];
  xfi(ret, tst);
  ret.add([txExpr(tst, env), ";", "){\n", txDo(body, env, false), "}\n"]);
  if(!stmtQ)
    wrap(ret, "(function(){\n", "; return null; }).call(this)");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Generates native for loop.
function sf_DASH_forxxx(ast, env){
  assertArity(ast.length >= 2, ast);
  let stmtQ = isStmt(ast),
      ret = sm_node(ast),
      body = exprHint(xfi(ast, ast.slice(2)), false);
  return body.length===0 ?
    ret :
    sf_DASH_foop(ret, `${ast[0]}`, xfi(ast, ast[1]), body, env, stmtQ)
}
SPEC_DASH_OPS["floop"] = sf_DASH_forxxx;
SPEC_DASH_OPS["rloop"] = sf_DASH_forxxx;
//////////////////////////////////////////////////////////////////////////////
//For loop implementation
function sf_DASH_foop(ret, cmd, args, body, env, stmtQ){
  let vars = [std.symbol("____coll"), null, std.symbol("____index"), 0];
  let indexer, tst, nb, sz, lvar, coll, start, end, step;
  let recurs = [],
      begin = 0,
      incr_QMRK = cmd == "floop",
      decr_QMRK = cmd == "rloop";
  if(std.symbol_QMRK(args[0])){
    begin = 2;
    lvar = args[0];
    coll = args[1];
    vars = [std.symbol("____coll"), coll, std.symbol("____index"), 0];
  }
  for(let e1,e,i = begin, end = args.length; i<end; i += 2){
    e = args[i];
    e1=args[i+1];
    if(e == "while"){
      tst = e1
    }else if(e == "index"){
      vars[2] = e1
    }else if(e == "recur"){
      recurs = e1
    }else if(e == "start"){
      start = e1
    }else if(e == "end"){
      end = e1
    }else if(e == "step"){
      step = e1
    }else if(std.symbol_QMRK(e)){
      vars.push(e, e1)
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
  vars.push( std.symbol("____end"), end);
  if(typeof(tst) == "undefined"){
    if(incr_QMRK)
      tst = [std.symbol("<"), indexer, std.symbol("____end")];
    if(decr_QMRK)
      tst = [std.symbol(">"), indexer, std.symbol("____end")];
  }
  ret.add("for (");
  for(let e, i = 0, end = vars.length; i<end; i+=2){
    e = vars[i];
    if(i === 0)
      ret.add("let ");
    if(i !== 0)
      ret.add(",");
    ret.add([txExpr(e, env), "=", txExpr(vars[i+1], env)]);
  }
  ret.add([",", BREAK, "=false;"]);
  nb = [std.symbol("not"), std.symbol("____break")];
  xfi(ret, nb);
  tst = typeof(tst) != "undefined" ? [std.symbol("and"), nb, tst] : nb;
  xfi(ret, tst);
  ret.add([txExpr(tst, env), "; "]);
  if(typeof(step) == "undefined"){ step = 1 }
  if(incr_QMRK)
    std.cons_BANG([std.symbol("+"), indexer, step], recurs);
  if(decr_QMRK)
    std.cons_BANG([std.symbol("-"), indexer, step], recurs);
  for(let e,i = 0, k = 2, end = recurs.length; i<end; ++i, k += 2){
    e = recurs[i];
    if(i !== 0)
      ret.add(",");
    ret.add([txExpr(vars[k], env), "=", txExpr(e, env)]);
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
  assertArity(ast.length >= 2, ast);
  let s = `${ast[1]}`,
      name = rdr.jsid("sf-jscode");
  return sm_node(ast, tnodeEx(name, s.endsWith("\"") && s.startsWith("\"") ? s.slice(1, -1) : s));
}
SPEC_DASH_OPS["raw#"] = sf_DASH_jscode;
//////////////////////////////////////////////////////////////////////////////
//Like defn, but the resulting function name is declared as a
//macro and will be used as a macro by the compiler when it is
//called.
//(defmacro macro-name [args] ...)
function sf_DASH_macro(ast, env){
  assertArity(ast.length >= 4, ast);
  let pms = [],
      args = ast[2],
      mname, mobj, doc,
      body = ast.slice(3);
  if(typeof(args) == "string"){
    doc = args;
    args = ast[3];
    body = ast.slice( 4);
  }
  [mobj,args] = isTaggedMeta(args, env);
  for(let e1,ev,e, i = 0, end = args.length; i < end; ++i){
    e = args[i];
    ev = `${e}`;
    e1=args[i+1];
    if(ev == "&"){
      if(Array.isArray(e1)){
        e = e1;
        ++i;
        for(let x,j = 0,sz = e.length; j < sz; ++j){
          x = e[j];
          if(!std.symbol_QMRK(x))
            throwE("syntax-error", ast);
          pms.push(x)
        }
      }else{
        pms.push(e, e1);
        ++i;
      }
    }else if(!std.symbol_QMRK(e)){
      throwE("syntax-error", ast)
    } else {
      pms.push(e)
    }
  }
  mname = ast[1];
  ast = [std.symbol("macro*"), mname, pms, body[0]];
  rt.addVar(mname, new Map([["ns", std._STAR_ns_STAR()]]));
  if(mobj && std.getProp(mobj, "private") === true){}else{
    _STAR_macros_STAR.set(mname, std.prn(ast, true))
  }
  rt.compute(ast, env);
  return "";
}
SPEC_DASH_OPS["defmacro"] = sf_DASH_macro;
//////////////////////////////////////////////////////////////////////////////
//Special unary operators.
function sf_DASH_unary(ast, env){
  assertArity(ast.length === 2, ast);
  let [a0,a1] = ast;
  if(a0 == "not"){ a0 = std.symbol("!") }
  return sm_node(ast).add(["(", `${txExpr(a0, env)}`,
                                `${txExpr(a1, env)}`, ")"]);
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
  return wrap(sm_node(ast), ["(function() {\n", "let ", `${cap}`, "=[];\n"],
                            [sf_DASH_doseq(exprHint(ast, false), env, cap), "return ", `${cap}`, ";\n}).call(this)"]);
}
SPEC_DASH_OPS["for"] = sf_DASH_listc;
//////////////////////////////////////////////////////////////////////////////
//Repeatedly executes body (presumably for side-effects) with
//bindings and filtering as provided by "for".  Does not retain
//the head of the sequence. Returns nil.
function sf_DASH_doseq(ast, env,capRes){
  let body = exprHint(xfi(ast, ast.slice(2)), false),
      while_QUOT = std.gensym(),
      kount = slib_BANG(COUNT),
      inner = "",
      ret,
      fst = true,
      args = ast[1],
      stmtQ = isStmt(ast);

  if(isOdd(args.length))
    throw new Error("bindings not even");

  let [x,y] = std.split_DASH_with(a=> !std.keyword_QMRK(a), args);
  let arr = std.rseq(std.partition(2, x));
  let recur = null;
  let _x_ = null;
  let _f_ = function(p1, pn){
    if(p1){
      let e_QUOT = std.gensym(),
          n_QUOT = std.gensym();
      ret = sm_node(ast);
      ret.add(["for(let ", `${n_QUOT}`, "=0,",0 === std.count(pn) ? `${while_QUOT}=true,` : "",
        `${e_QUOT}`, "=", txExpr(p1[1], env), ",____sz=", kount, "(", `${e_QUOT}`, ")",
        (fst ? ",____break=false" : ""), "; (",(fst ? "!____break && " : ""),
        `${while_QUOT}`, " && ", "(", `${n_QUOT}`, " < ____sz)", "); ++", `${n_QUOT}`, "){\n"]);
      ret.add(sf_DASH_var(xfi(ast, [std.symbol("vars"), p1[0], [std.symbol("nth"), e_QUOT, n_QUOT]]), env));
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
  recur=function(){
    _x_=arguments;
    if(_r_){
      for(_r_ = undefined; _r_ === undefined;){
        _r_ = _f_.apply(this, _x_)
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
  let patch = sm_node(ast);
  //console.log(std.prn(binds))
  std.partition(2, binds).forEach(function(GS__71){
    let [k,expr] = GS__71;
    if("let" == k){
      ret.add(sf_DASH_var(xfi(ast, std.cons(std.symbol("vars"), expr))))
    }else if("when" == k){
      ret.add(["if (", txExpr(expr, env), ") {\n"]);
      patch.add("}\n");
    }else if("while" == k){
      ret.add(["if (!(", txExpr(expr, env), ")) { ", `${while_QUOT}`, "=false; ____break=true; } else {\n"]);
      patch.add("}\n");
    }
  });
  if(capRes){
    exprHint(body, true);
    ret.add([`${capRes}`, ".push((function() {\n", txDo(body, env, true), "\n}).call(this));\n"]);
  }else{
    ret.add(txDo(body, env, false));
  }
  return ret.add(patch);
}
//////////////////////////////////////////////////////////////////////////////
//Transfer source map info
function xfi(from,to){
  try{
    if(from && to && !isSimple(to) && typeof(to.line) != "number" && typeof(from.line) == "number"){
      to["source"] = from.source;
      to["line"] = from.line;
      to["column"] = from.column;
    }
  }catch(e){
    console.log("warning from xfi()")
  }
  return to;
}
//////////////////////////////////////////////////////////////////////////////
//Dump all macros to string.
function spitMacros(){
  return std.count(_STAR_macros_STAR)===0 ?
    "{}" :
    std.wrap_DASH_str(std.seq(_STAR_macros_STAR).map(function(GS__73){
      let [k,v] = GS__73;
      return [std.quote_DASH_str(`${k}`), ":", std.quote_DASH_str(v)].join("");
    }).join(",\n"), "{\n", "}\n");
}
//////////////////////////////////////////////////////////////////////////////
//Dump all public vars to string.
function spitVars(){
  return std.count(_STAR_vars_STAR)===0 ?
    "[]" :
    std.wrap_DASH_str(_STAR_vars_STAR.map(a=> std.quote_DASH_str(`${a}`)).join(","), "[ ", "]");
}
//////////////////////////////////////////////////////////////////////////////
//Write out export info
function spitExterns(){
  return ["\n\nmodule.exports = {\n",
          [EXPKEY, ": { ns: ",
           std.quote_DASH_str(std._STAR_ns_STAR()),
           ", vars: ", spitVars(), ", macros: ", spitMacros(), " }"].join(""),
           (std.not_DASH_empty(_STAR_vars_STAR) ?
           [",\n", (_STAR_vars_STAR || []).map(a=> [rdr.jsid(a), ":", rdr.jsid(a)].join("")).join(",\n")].join("") : null), "\n};\n"].join("");
}
//////////////////////////////////////////////////////////////////////////////
//Banner text for the target file
function banner(){
  let GS__74 = std.peek_DASH_nsp(),
      id = std.getProp(GS__74, "id"),
      meta = std.getProp(GS__74, "meta");
  return ["/*", "Auto generated by Kirby v", MOD_DASH_VER,
          " - ", new Date(), "\n",
          "  ", id, "\n",(meta ? std.prn(meta, true) : ""), "\n", "*/\n\n"].join("");
}
//////////////////////////////////////////////////////////////////////////////
//Get rid of empty lines or no-op lines
function cleanCode(code){
  return code.split("\n").map(function(a){
    let s = a.trim();
    return s.length > 0 ? (s != ";" ? a : null) : null;
  }).filter(a=> std.not_DASH_empty(a)).join("\n");
}
//////////////////////////////////////////////////////////////////////////////
//Compiles a source file, returning the translated source and
//possible error object.
function transpile_STAR(source, fname, options){
  let source_DASH_map = std.getProp(options, "source-map");
  let no_DASH_format = std.getProp(options, "no-format");
  let verbose = std.getProp(options, "verbose");
  let err,ret = txTree(rdr.parse(source, fname), rt.genv());
  let [fmap,smap]= [".js", ".map"].map(a=> [path.basename(fname, ".ky"), a].join(""));
  if(source_DASH_map){
    let sout = ret.toStringWithSourceMap({ skipValidation: true, file: fmap });
    ret = sout.code;
    fs.writeFileSync(smap, sout.map);
  }
  let cstr = [ret, spitExterns(),
              source_DASH_map ? ["\n//# sourceMappingURL=", path.relative(path.dirname(fname), smap)].join("") : null].join("");
  try{
    if(!no_DASH_format)
      cstr = esfmt.format(cstr, {});
  }catch(e){
    err = e
  }
  cstr = cleanCode(cstr);
  return [cstr.length===0 ? "" : [banner(), cstr].join(""), err];
}
//////////////////////////////////////////////////////////////////////////////
//Compile kirby file to target source
function transpile(code, file,options){
  _STAR_last_DASH_line_STAR = 0;
  _STAR_last_DASH_col_STAR = 0;
  _STAR_externs_STAR = new Map();
  _STAR_macros_STAR = new Map();
  _STAR_vars_STAR = std.vector();
  try{
    return transpile_STAR(code, file, std.opt_QMRK__QMRK(options, {}))
  }catch(e){
    println("Error near line: ", _STAR_last_DASH_line_STAR, ", col: ", _STAR_last_DASH_col_STAR, "\n", [e].join(""))
  }
}
//////////////////////////////////////////////////////////////////////////////
//Dump AST to xml
function dbgAST(source, fname){
  return rdr.dumpAst(rdr.parse(source, fname), fname)
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

