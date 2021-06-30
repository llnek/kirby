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
const core = require("./core");
const std = require("./kernel");
const rdr = require("./reader");
const rt = require("./engine");
const {KBSTDLR,
KBSTDLIB,
KBPFX,
EXPKEY} = rt;
const println=std["println"];
//////////////////////////////////////////////////////////////////////////////
const ERRORS_MAP = new Map([
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
  ["rename-var", "Invalid rename"],
  ["unknown-var", "Unknown var"],
  ["unknown-keyword", "Unknown keyword"],
  ["invalid-arity", "Invalid function arity"],
  ["invalid-meta", "Invalid meta data"],
  ["syntax-error", "Syntax error"],
  ["empty-form", "Invalid form (empty)"]]);
const MOD_DASH_VER = "1.0.0";
const LARGS = "____args";
var _STAR_externs_STAR = new Map();
var _STAR_macros_STAR = new Map();
var _last_line_ = 0;
var _last_column_= 0;
var _STAR_vars_STAR = [];
var SPEC_DASH_OPS = {};
var MATH_DASH_OP_DASH_REGEX = /^[-+][0-9]+$/;
//////////////////////////////////////////////////////////////////////////////
/**Defining a primitive data type, wraps around a simple value. */
class Primitive{
  constructor(v){ this.value = v }
  toString(){ return this.value }
}
//////////////////////////////////////////////////////////////////////////////
function kbStdRef(n){
  return slibBANG(`${KBSTDLR}.${n}`) }
//////////////////////////////////////////////////////////////////////////////
function isAstMap(ast){
  return std.isPair(ast,1) && std.isSymbol(ast[0],"hashmap*") }
//////////////////////////////////////////////////////////////////////////////
function isAstSet(ast){
  return std.isPair(ast,1) && std.isSymbol(ast[0],"hashset*") }
//////////////////////////////////////////////////////////////////////////////
function isAstVec(ast){
  return std.isPair(ast,1) && std.isSymbol(ast[0],"vector*") }
//////////////////////////////////////////////////////////////////////////////
function isAstList(ast){
  return std.isPair(ast,1) && std.isSymbol(ast[0],"list*") }
//////////////////////////////////////////////////////////////////////////////
function isAstObj(ast){
  return std.isPair(ast,1) && std.isSymbol(ast[0],"object*") }
//////////////////////////////////////////////////////////////////////////////
/** @private */
function unmangle(s){
  return s.split(".").map(a=> rdr.jsid(a)).join(".") }
//////////////////////////////////////////////////////////////////////////////
function tnode(name,txt,src,ln,col){
  return new smap.SourceNode(ln===undefined?null:ln,
                             col===undefined?null:col,
                             src===undefined?null:src,
                             txt===undefined?null:txt,
                             name===undefined?null:name) }
//////////////////////////////////////////////////////////////////////////////
/** Source-Map node */
function smNode(ast,obj){
  const rc = obj || tnode();
  try{
    rc["source"] = ast.source;
    rc["column"] = ast.column;
    rc["line"] = ast.line;
  }catch(e){
    console.warn("smNode() near line: " + ast.line) }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function wrap(ret,head,tail)
{
  if(ret){
    if(head) ret.prepend(head);
    if(tail) ret.add(tail); } return ret }
//////////////////////////////////////////////////////////////////////////////
/**Flag the AST if it is an expression */
function exprHint(ast, flag){
  let rc = std.isSimple(ast) ? new Primitive(ast) : ast;
  rc["____expr"] = flag;
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function throwE(e,ast,msg){
  std.throwE([ERRORS_MAP.get(e), (msg?` : ${msg}`:"")].join(""), ast&&ast.line) }
//////////////////////////////////////////////////////////////////////////////
function isStmt(ast){
  return std.isSimple(ast) ? throwE("syntax-error", ast) : (ast.____expr === false) }
//////////////////////////////////////////////////////////////////////////////
/** true if cmd is a function */
function fnQQ(cmd){
  function t(re,x){ if(x) return re.test(x) }
  return t(rdr.REGEX.func, cmd) ? `(${cmd})` : cmd }
//////////////////////////////////////////////////////////////////////////////
/**Process a file unit.  Sort out all the macros first then others.
 * Also, always check first for (ns ...)
 */
function transUnit(root, env){
  let ms = [], os = [],
      t, n1 = root[0], ret = smNode(root);
  if(!(std.isPair(n1,1) && std.isSymbol(n1[0],"ns"))){
    throwE("(ns ...) must be first form in file")
  }
  ms.push(n1);
  for(let i=1; i<root.length; ++i){
    t= root[i];
    (std.isPair(t,1) && std.isSymbol(t[0],"defmacro") ? ms : os).push(t) }
  ms.concat(os).forEach(r=>{
    _last_line_= r.line;
    _last_column_= r.column;
    if(t=txExpr(r, env)) ret.add([t, ";\n"]) });
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Transpile an atom */
function txAtom(a){
  let rc,
      s = `${a}`;
  if(a instanceof rdr.LambdaArg){
    rc=`${LARGS}[${parseInt(s.slice(1))-1}]`
  }else if(a instanceof std.RegexObj){
    //get rid of #, "#/blah/"
    rc=smNode(a, tnode(s, s.slice(1)))
  }else if(std.isKeyword(a)){
    rc=smNode(a, tnode(s, std.quoteStr(s)))
  }else if(std.isSymbol(a)){
    rc=smNode(a, tnode(s, unmangle(s)))
  }else if(a===null){
    rc="null"
  }else if(a instanceof Primitive){
    a = a.value;
    s = `${a}`;
    rc=typeof(a)=="string" ? std.quoteStr(a)
                           : a === null ? "null" : s;
  }else if(typeof(a) == "string"){
    rc= std.quoteStr(a)
  }else if(std.isVec(a)){
    rc=smNode(a);
    for(let i=0;i<a.length;++i){
      if(i>0)rc.add(",");
      rc.add(txExpr(a[i]));
    }
    rc=wrap(rc, [kbStdRef("vec"),"("],")");
  }else{
    rc=rdr.jsid(s)
  }
  return rc
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function txExpr(x,env){
  return std.isPair(x) ? txPairs(x, env) : txAtom(x) }
//////////////////////////////////////////////////////////////////////////////
/**Maybe get the command */
function gcmd(ast){
  return std.isPair(ast,1) && !std.isPair(ast[0]) ? `${ast[0]}` : "" }
////////////////////////////////////////////////////////////////////////////////
/** @private */
function spread(from, to){
  xfi(from, to);
  if(!std.isSimple(from) && !std.isSimple(to) &&
     typeof(from.line)=="number" &&
     typeof(to.forEach)!="undefined"){ to.forEach(z=> spread(from, z)) } }
//////////////////////////////////////////////////////////////////////////////
/**Deal with s-expr(list) */
function txPairs(ast, env){
  let nsp= core.peekNS();
  let stmtQ= isStmt(ast);
  let orig=ast, e1=ast[0];
  let ecnt,op, tmp;
  let cmd = gcmd(ast),
      ret = smNode(ast),
      mc=rt.getMacro(cmd);
  xfi(ast, ret);
  if(mc){
    //deal with a macro
    ast= rt.expandMacro(ast, env, mc);
    ast= exprHint(ast, !stmtQ);
    ast= xfi(orig, ast);
    //spread(orig, ast);
    cmd = gcmd(ast);
  }
  //////////////////////////////////////////////////////////////////////////////
  //handle case: (+1 x) => (+ x 1)
  if(rdr.REGEX.int.test(cmd)){
    if(ast.length!=2)
      throwE("syntax-error",ast);
    if(cmd[0] != "-" && cmd[0] != "+") cmd=`+${cmd}`;
    ast = xfi(ast, std.pair(std.symbol(cmd[0]), ast[1], parseInt(cmd.slice(1))));
    cmd = `${ast[0]}`;
  }
  //check if special op
  if(op=SPEC_DASH_OPS[cmd]){
    //run spec op
    ret = op(ast, env)
  }else if(cmd == "with-meta"){
    if(ast.length!=3)
      throwE("syntax-error",ast);
    ret.add(txExpr(isTaggedMeta(ast, env)[1], env));
  }else if(cmd.startsWith(".-")){
    //object property access
    if(ast.length!=2)
      throwE("syntax-error",ast);
    ret.add([txExpr(ast[1], env),".",txExpr(std.symbol(cmd.slice(2)), env)]);
  }else if(cmd.startsWith(".@")){
    //array index access (.@i v) => v[i], (.@+i v) => v[i+1]
    if(ast.length!=2)
      throwE("syntax-error",ast);
    ret.add([txExpr(ast[1], env), "[",
             cmd.slice(cmd.startsWith(".@+")?3:2),
             cmd.startsWith(".@+") ? "+1" : "", "]"]);
  }else if(cmd.startsWith(".")){
    if(ast.length<2)
      throwE("syntax-error",ast);
    //(.foo obj p1 p2 p3)
    //deal with parameters
    let pms= [];
    for(let i=0,a_= ast.slice(2); i< a_.length; ++i){
      pms.push(txExpr(a_[i], env))
    }
    //generates obj.foo(p1,p2,p3)
    ret.add([txExpr(ast[1], env), txExpr(std.symbol(cmd), env)].concat("(", pms.join(",") , ")"));
  }else{
    ecnt=std.isPair(ast)?ast.length:1;
    if(ecnt==2 && isAstMap(ast[1]) && (std.isStr(ast[0]) ||
                                       std.isKeyword(ast[0]))){
      cmd=kbStdRef("getProp");
      ret.add([cmd,"(", txExpr(ast[1]), ",", txExpr(ast[0]), ")"]);
    }else if(ecnt==2 && isAstMap(ast[0]) && (std.isStr(ast[1]) ||
                                             std.isKeyword(ast[1]))){
      cmd=kbStdRef("getProp");
      ret.add([cmd,"(", txExpr(ast[0]), ",", txExpr(ast[1]), ")"]);
    }else if(std.isPair(ast,1)){
      //handle general form (a b c ...)
      cmd=txExpr(ast[0]);
      for(let i=1;i<ast.length;++i)
        ast[i]=txExpr(ast[i]);
      ret.add([fnQQ(slibBANG(cmd)),"("]);
      for(let i=1;i<ast.length;++i){
        if(i>1)
          ret.add(",");
        ret.add(ast[i]);
      }
      ret.add(")");
    }else if(std.isPair(ast)){
      throwE("empty-form", ast)
    }else{
      cmd=txExpr(ast,env);
      if(!cmd)
        throwE("syntax-error",ast);
      ret.add(cmd);
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function isWithMeta(o){
  return std.isPair(o,1) && 3 === o.length && std.isSymbol(o[0], "with-meta") }
//////////////////////////////////////////////////////////////////////////////
function isTaggedMeta(obj, env){
  let rc;
  if(!isWithMeta(obj)){
    rc=[null, obj];
  }else{
    let [_,e2,m3]=obj;
    e2["____meta"] = evalMeta(m3, env);
    rc= [e2.____meta, e2];
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function evalMeta(ast, env){
  let rc=ast;
  if(std.isKeyword(ast)){
    rc=new Map();
    rc.set(`${ast}`,true);
  }else if(std.isSymbol(ast)){
    rc=new Map();
    rc.set("tag", ast);
  }else if(!std.isPair(ast)){
    throwE("invalid-meta", ast)
  }
  return rt.compute(rc,env);
}
//////////////////////////////////////////////////////////////////////////////
/**Maybe strip out kirbyref
 * @private
 */
function slibBANG(cmd){
  let lib = `${KBSTDLR}.`,
      nsp = core.peekNS();
  cmd = `${cmd}`;
  return cmd.startsWith(lib) &&
         nsp.get("id") == KBSTDLIB ? cmd.slice(lib.length) : cmd }
//////////////////////////////////////////////////////////////////////////////
//Transfer source map info
function xfi(from,to){
  try{
    if(from && to && !std.isSimple(to) &&
       typeof(to.line) != "number" &&
       typeof(from.line) == "number"){
      to["source"] = from.source;
      to["line"] = from.line;
      to["column"] = from.column;
    }
  }catch(e){
    console.warn("warning from xfi()") }
  return to;
}
//////////////////////////////////////////////////////////////////////////////
//Dump all macros to string.
function spitMacros(){
  return _STAR_macros_STAR.length===0 ?
    "{}" :
    std.wrapStr(std.seq(_STAR_macros_STAR).map(function([k,v]){
      return [std.quoteStr(`${k}`), ":", std.quoteStr(v)].join("");
    }).join(",\n"), "{\n", "}\n");
}
//////////////////////////////////////////////////////////////////////////////
//Dump all public vars to string.
function spitVars(){
  return _STAR_vars_STAR.length===0 ?
    "[]" :
    std.wrapStr(_STAR_vars_STAR.map(a=> std.quoteStr(`${a}`)).join(","), "[ ", "]");
}
//////////////////////////////////////////////////////////////////////////////
//Write out export info
function spitExterns(){
  return ["\n\nmodule.exports = {\n",
          [EXPKEY, ": { ns: ",
           std.quoteStr(core.starNSstar()),
           ", vars: ", spitVars(), ", macros: ", spitMacros(), " }"].join(""),
           (_STAR_vars_STAR.length>0 ?
           [",\n", _STAR_vars_STAR.map(a=> `${rdr.jsid(a)}:${rdr.jsid(a)}`).join(",\n")].join("") : null), "\n};\n"].join("")
}
//////////////////////////////////////////////////////////////////////////////
//Banner text for the target file
function banner(){
  let nsp = core.peekNS(),
      id = nsp.get("id"),
      meta = nsp.get("meta");
  return ["/*", "Auto generated by Kirby v", MOD_DASH_VER,
          " - ", new Date(), "\n",
          "  ", id, "\n",(meta ? std.prn(meta, true) : ""), "\n", "*/\n\n"].join("");
}
//////////////////////////////////////////////////////////////////////////////
//Get rid of empty lines or no-op lines
function cleanCode(code){
  return code.split("\n").map(a=>{
    let s = a.trim();
    return s && s != ";" ? a : null; }).filter(a=> a).join("\n");
}
//////////////////////////////////////////////////////////////////////////////
//Compiles a source file, returning the translated source and
//possible error object.
function transEx(source, fname, options){
  let sourcemap = options["source-map"];
  let noformat = options["no-format"];
  let verbose = options["verbose"];
  let cstr,err,ret = transUnit(rdr.parse(source, fname), rt.genv());
  let [fmap,smap]= [".js", ".map"].map(a=> `${path.basename(fname, ".ky")}${a}`);
  if(sourcemap){
    let sout = ret.toStringWithSourceMap({ skipValidation: true, file: fmap });
    ret = sout.code;
    fs.writeFileSync(smap, sout.map);
  }
  cstr = ret + spitExterns();
  if(sourcemap)
    cstr += ["\n//# sourceMappingURL=",
             path.relative(path.dirname(fname), smap)].join("");
  try{
    if(!noformat)
      cstr = esfmt.format(cstr, {});
  }catch(e){
    err = e
  }
  cstr = cleanCode(cstr);
  return [cstr.length===0 ? "" : `${banner()}${cstr}`, err];
}
//////////////////////////////////////////////////////////////////////////////
function regSpecF(id, func){
  if(!Array.isArray(id)) id=[id];
  id.forEach(n=> SPEC_DASH_OPS[n]=func);
}
//////////////////////////////////////////////////////////////////////////////
//Compile kirby file to target source
function transpile(code, file,options){
  _last_line_= 0;
  _last_column_= 0;
  _STAR_externs_STAR.clear();
  _STAR_macros_STAR.clear();
  _STAR_vars_STAR.length = 0;
  try{
    return transEx(code, file, options || {})
  }catch(e){
    //console.log(e.stack);
    println("Error near line: ", _last_line_, ", column: ", _last_column_, "\n", `${e}`) }
}
const version = MOD_DASH_VER;
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.compiler",
    vars: [],
    macros: {}
  },
  MOD_DASH_VER,
  LARGS,
//var _STAR_externs_STAR = undefined;
//var _STAR_macros_STAR = undefined;
//var _STAR_vars_STAR = undefined;
  SPEC_DASH_OPS,

  Primitive,
  isAstMap,
  isAstSet,
  isAstVec,
  isAstList,
  isAstObj,

  isTaggedMeta,
  isStmt,
  exprHint,
  evalMeta,
  wrap,
  xfi,
  throwE,
  txExpr,
  smNode,
  tnode,
  version,
  transpile,
  kbStdRef,
  slibBANG,
  regSpecF,
  LARGS,
  //ERRORS_DASH_MAP,
  _STAR_vars_STAR,
  _STAR_macros_STAR,
  _STAR_externs_STAR
};

//////////////////////////////////////////////////////////////////////////////
//EOF

