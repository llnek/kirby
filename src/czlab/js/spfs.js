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
const path = require("path");
const std = require("./kernel");
const rdr = require("./reader");
const rt = require("./engine");
const cc = require("./compiler");
const {KBSTDLR,
KBSTDLIB,
KBPFX,
EXPKEY} = rt;
//////////////////////////////////////////////////////////////////////////////
const ARRSLICE = "Array.prototype.slice.call",
      JSARGS = "arguments",
      BREAK = "____break",
      START="____start",
      END="____end",
      COLL="____coll",
      INDEX="____index",
      slibBANG=cc["slibBANG"],
      kbStdRef=cc["kbStdRef"],
      txExpr=cc["txExpr"],
      smNode=cc["smNode"],
      tnode=cc["tnode"],
      wrap=cc["wrap"],
      xfi=cc["xfi"],
      isStmt=cc["isStmt"],
      throwE=cc["throwE"],
      exprHint=cc["exprHint"],
      isTaggedMeta=cc["isTaggedMeta"];
//////////////////////////////////////////////////////////////////////////////
/** @private */
function isEven(n){ return n%2 ===0 }
/** @private */
function isOdd(n){ return n%2 !==0 }
//////////////////////////////////////////////////////////////////////////////
/** @private */
function assertArity(kond, ast){
  if(!kond)
    throwE("invalid-arity", ast);
  return true;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function evalQuote(ast){
  while(std.isPair(ast,1) &&
        std.isSymbol(ast[0],"quote") && ast.length===2){ ast=ast[1] }
  return ast;
}
//////////////////////////////////////////////////////////////////////////////
/**Convert to js comment
 * @private
 */
function writeDoc(doc, attrs){
  let t,s,out=[];
  doc=doc||"";
  if(attrs && attrs.size>0){
    s=attrs.get("doc");
    t=attrs.delete("doc");
    if(s)
      doc += "\n"+ s + "\n";
    out.push("/* " + std.prn(attrs,1) + " */\n");
    if(t)
      attrs.set("doc",s);
  }
  return out.concat(std.split(std.unquoteStr(doc), "\n").map(a=>{
    //s = `${a}`.trim();
    //return s  ? `//${s}\n` : null;
    return `//${a}\n`;
  }).filter(a=> a))
}
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function vecFromAstVec(ast){
  let v= std.vector();
  for(let i=1; i < ast.length;++i){
    v.push(ast[i])
  }
  return v;
}
//////////////////////////////////////////////////////////////////////////////
/**Load in all the exported macros from the external lib
 * @private
 */
function loadRLib(info, env){
  let {ns, vars, macros} = info;
  function loop(v,k){
    //console.log("loading "+v);
    let ast = rt.readAST(v);
    ast[1] = std.symbol(`${ns}/${ast[1]}`);
    //indirectly loading into runtime engine
    return rt.compute(ast, env);
  }
  if(typeof(macros.forEach)!="undefined"){
    macros.forEach(loop)
  }else{
    Object.keys(macros).forEach(k=> loop(macros[k], k))
  }
  return ns;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns a tuple(A,B) where A is the vars as [symbols] and B is #{strings}
 * @private
 */
function loadRVars(info, env){
  const vs= info["vars"] || [];
  return [vs.map(a=> std.symbol(a)),
          vs.reduce((s,y)=> s.add(y), new Set())] }
//////////////////////////////////////////////////////////////////////////////
/**Handle the require clause by looking through the remote lib, finding
 * exported vars and macros
 * @private
 */
function requireEx(ret, fdir, ast, env){
  let used, rlib, mcs, nsp, vvv, info;
  let libpath, refers, renames, rpath = `${ast[0]}`, as = `${std.gensym("R__")}`;

  if(std.isSymbol(rpath))
    rpath = std.quoteStr(`${rpath}`);

  //find the extra hints
  for(let s,v1,v,j=1; j< ast.length; j += 2){
    v = ast[j];
    s=`${v}`;
    v1=ast[j+1];
    if("as" == s){
      as = `${v1}`
    }else if("refer" == s){
      refers = v1
    }else if("rename" == s){
      renames = v1
    }
  }

  //load the remote lib and introspect exported symbols

  libpath = txExpr(rpath.includes("./") ? path.resolve(fdir, rpath) : rpath, env);
  ret.add(["const ", rdr.jsid(as), "=require(", txExpr(rpath, env), ");\n"]);
  rlib = std.requireJS(std.unquoteStr(libpath));
  if(rlib)
    info = rlib[EXPKEY];
  rt.addLib(`${as}`, rlib);
  if(info){
    mcs = info["macros"]; //macros
    vvv = loadRVars(info, env); //vars
    nsp = loadRLib(info, env); //namespace
  }
  mcs = mcs || {};
  vvv = vvv || [];
  used = new Set();
  nsp = nsp || "";

  //deal with referenced symbols

  //if refer-all, load in all exported vars
  if(std.isKeyword(refers) && `${refers}` == "all"){
    refers = vvv[0]
  }
  if(renames){
    if(!cc.isAstMap(renames) || isEven(renames.length)){
      throw Error("Bad ns:renames object")
    }
    for(let i=1; i< renames.length; i += 2){
      let ro = renames[i], ev = `${ro}`;
      let rn = renames[i+1], rs = `${rn}`;
      if(info){
        if(!mcs[ev] && !vvv[1].has(ev))
          throwE("unknown-var",ast, `${ev}`);
        if(mcs[rs] || vvv[1].has(rs))
          throwE("invalid-rename",ast,`${ev} -> ${rs}`) }
      rt.addVar(rs, std.hashmap("ns", nsp));
      used.add(ev);
      ret.add(["const ", txExpr(rn, env), "=",
               as, "[\"", txExpr(ro, env), "\"];\n"]);
    }
  }
  refers=evalQuote(refers) || [];
  for(let r, rs, v, i=0; i<refers.length; ++i){
    r = refers[i];
    rs = `${r}`;
    v = txExpr(r, env);
    if(!used.has(rs)){
      if(info && !mcs[rs] && !vvv[1].has(rs)){
        throwE("unknown-var",ast, `${rs}`)
      }
      rt.addVar(rs, std.hashmap("ns", nsp));
      ret.add(["const ", v, "=", as, "[\"", v, "\"];\n"]);
    }
  }
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function writeFuncInfo(fname, ast){
  let file = ast.source ? ast.source.slice(ast.source.lastIndexOf("/") + 1) : "?";
  let s = `//fn: [${fname}] in file: ${file}, line: ${ast.line || "?"}\n`;
  let len = s.length;
  if(len < 80){ len = 80 }
  return ["/".repeat(len), "\n", s].join("");
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function writeFuncPre(pre, env){
  let ret = smNode(pre);
  let c2 = std.pair(std.symbol("if-not"),
                    std.pair(std.symbol("and")).concat(pre),
                    std.pair(std.symbol("throw"), std.pair(std.symbol("Error"), "Precondition failed")));
  return ret.add([txExpr(exprHint(c2, false), env), ";\n"]);
}
//////////////////////////////////////////////////////////////////////////////
/**A Do block
 * @private
 */
function txDo(ast, env,retQ){
  let stmtQ = isStmt(ast),
      ret = smNode(ast),
      e, end = ast.length - 1;

  retQ = stmtQ ? false : retQ===undefined?true:retQ;
  for(let i=0; i<end; ++i)
    ret.add([txExpr(exprHint(ast[i], false), env), ";\n"])

  if(end >= 0){
    e = txExpr(exprHint(ast[end], !stmtQ), env);
    ret.add([retQ ? ["return ", e] : e, ";\n"]);
  }

  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Destruct a vec
 * @private
 */
function dstruVec(src, coll, env){
  let ret = smNode(coll),
      rval,out,as = txExpr(src, env);
  for(let e,i=0; i<coll.length; ++i){
    rval = smNode(coll);
    out = smNode(coll);
    e = coll[i];
    if(std.isSymbol(e)){
      if(e == "&"){
        e=coll[i+1];
        rval.add(`${ARRSLICE}(${as},${i})`);
        ret.add(["let ", txExpr(std.isSymbol(e)?e:dstru(e,out,env),env), "=", rval, ";\n", out]);
        break;
      }else if(e != "_"){
        ret.add(["let ", txExpr(e, env), "=", kbStdRef("getIndex"), "(", as, ",", `${i}`, ");\n"]);
      }
    }else if(std.isVec(e)){
      rval.add(`${as}[${i}]`);
      ret.add(["let ", txExpr(dstru(e, out, env), env), "=", rval, ";\n", out]);
    }else if(std.isKeyword(e)){
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
  let ret = smNode(coll),
      arr, as = txExpr(src, env);
  for(let e,i=1; i<coll.length; i += 2){
    e=coll[i];
    if(std.isKeyword(e)){
      if(e == "keys" || e == "strs"){
        for(let a,j=0, c2=coll[i+1]; j<c2.length; ++j){
          a= c2[j];
          ret.add(["let ", txExpr(a, env), "=",
                   kbStdRef("getProp"), "(", as, ",", std.quoteStr(`${a}`), ");\n"]) }
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
/**Decide on what the rhs should be referred to 'as'
 * @private
 */
function dstru(coll, out, env){
  let d,rhs = std.gensym();
  for(let e,i=0; i<coll.length; ++i){
    e=coll[i];
    if(std.isKeyword(e) && `${e}` == "as"){
      rhs = std.symbol(`${coll[i+1]}`);
      break;
    }
  }
  xfi(coll, rhs);
  if(cc.isAstMap(coll))
    d=dstruMap(rhs,coll,env);
  else if(std.isVec(coll))
    d=dstruVec(rhs,coll,env);
  else
    throwE("destruct-args",coll);
  if(d)
    out.add(d);
  return rhs;
}
//////////////////////////////////////////////////////////////////////////////
/**Deal with possible destructuring of args in function definition
 * @private
 */
function dstruFArgs(args, env){
  let ret = [smNode(args), smNode(args)];
  let rval, out, pms=[], [fargs, fdefs]=ret;
  for(let e,i=0; i<args.length; ++i){
    rval = smNode(args);
    out = smNode(args);
    e=args[i];
    if(cc.isAstVec(e)){
      e=vecFromAstVec(e);
    }
    if(std.isSymbol(e)){
      if(e != "&"){
        pms.push(e == "_" ? xfi(e, std.gensym("U__")) : e)
      }else{
        e = args[i+1]
        rval.add(`${ARRSLICE}(${JSARGS},${i})`);
        fdefs.add(["let ", txExpr(std.isSymbol(e)? e: dstru(e,out,env),env), "=", rval, ";\n", out]);
        break;
      }
    }else if(std.isVec(e) || cc.isAstMap(e)){
      rval.add(`${JSARGS}[${i}]`);
      pms.push(dstru(e, out, env));
      fdefs.add(out);
    }else{console.log(std.prn(args,1))
      throwE("destruct-args", args)
    }
  }
  pms.forEach(a=> fargs.add(txExpr(a, env)));
  fargs.join(",");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
////special forms
//////////////////////////////////////////////////////////////////////////////
//Loads libs.
//(:require ["z" :rename {hello goodbye}])
//(:require ["a" :as A])
//(:require "blah" :as WWW)
//(:require ["b"]
//          ["c" :refer [hello world]])
function sfRequire(ast, env){
  assertArity(ast.length >= 2, ast);
  let ret = cc.smNode(ast),
      fdir = path.dirname(ast.source);
  if(std.isSymbol(ast[1]) || std.isStr(ast[1])){
    //single require, fake it to a vec
    let v=std.vector();
    for(let i=1;i<ast.length;++i)v.push(ast[i]);
    ast.splice(1);
    ast.push(v);
  }
  for(let a,i = 1; i< ast.length; ++i){
    a= ast[i];
    //deal with (:require '("x" :as blah))
    if(std.isPair(a,1)){
      a=evalQuote(a)
    }
    if((std.isVec(a,1) || std.isPair(a,1)) &&
       (std.isSymbol(a[0]) || std.isStr(a[0]))){}else{
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
function sfNS(ast, env){
  assertArity(std.isPair(ast,1) && ast.length >= 2, ast);
  let doc,e,mobj,
      pos=2,ret = smNode(ast),
      [attrs,nsp] = isTaggedMeta(ast[1], env);
  if(!std.isSymbol(nsp))
    throwE("invalid-namespace", ast);
  if(std.isStr(ast[pos])){
    //doc string found
    attrs = attrs||new Map();
    attrs.set("doc", ast[pos]);
    ++pos;
  }
  //explicit meta
  if(cc.isAstMap(ast[pos])){
    e= cc.evalMeta(ast[pos], env);
    ++pos;
    nsp["____meta"] =
    attrs = std.mergeBANG(attrs, e);
  }
  //update the namespace stack
  std.pushNS(`${nsp}`, attrs);
  ast = xfi(ast, ast.slice(pos));
  for(let e,i = 0; i<ast.length; ++i){
    e = ast[i];
    if(std.isPair(e,1) &&
       std.isKeyword(e[0],":require"))
      ret.add(sfRequire(xfi(ast, e), env))
  }
  nsp = std.starNSstar();
  if(nsp != rt.KBSTDLIB){
    e=std.pair(std.keyword(":require"), "kirby",
               std.keyword(":as"), std.symbol(KBSTDLR));
    ret.add(sfRequire(xfi(ast, e), env));
  }
  ret.add(["const ", std.MODULE_NAMESPACE, "=", std.quoteStr(nsp), ";\n"]);
  return ret;
}
cc.regSpecF("ns",sfNS);
//////////////////////////////////////////////////////////////////////////////
//Takes a set of functions and returns a fn that is the juxtaposition
//of those fns.  The returned fn takes a variable number of args, and
//returns a vector containing the result of applying each fn to the
//args (left-to-right).
//((juxt a b c) x) => [(a x) (b x) (c x)]
function sfJuxt(ast, env){
  let ret = smNode(ast);
  for(let i=1;i<ast.length; ++i){
    if(i>1)
      ret.add(",");
    ret.add([txExpr(ast[i], env),"(...", cc.LARGS, ")"]) }
  return wrap(ret, ["function(...",cc.LARGS,"){\nreturn ["], "];\n}")
}
cc.regSpecF("juxt",sfJuxt);
//////////////////////////////////////////////////////////////////////////////
//Returns an atom's current state.
function sfDeref(ast, env){
  assertArity(ast.length === 2, ast);
  return smNode(ast).add([txExpr(ast[1], env), ".value"])
}
cc.regSpecF("deref", sfDeref);
////////////////////////////////////////////////////////////////////////////////
//Takes a set of functions and returns a fn that is the composition
//of those fns.  The returned fn takes a variable number of args,
//applies the rightmost of fns to the args, the next
//fn (right-to-left) to the result, etc.
function sfCompose(ast, env){
  assertArity(ast.length >= 2, ast);
  let last="",
      ret = smNode(ast);
  for(let a,i=1; i< ast.length; ++i){
    last+=")";
    ret.add([txExpr(ast[i],env),"("]);
  }
  return wrap(ret, ["function(...",cc.LARGS,"){\nreturn "], ["...",cc.LARGS,last,";\n", "}"]);
}
cc.regSpecF("comp", sfCompose);
//////////////////////////////////////////////////////////////////////////////
/** @private */
function quoteXXX(ast, env){
  return std.isPair(ast)||std.isVec(ast) ? quoteBlock(ast,env) : quoteSingle(ast) }
//////////////////////////////////////////////////////////////////////////////
/** @private */
function quoteBlock(ast, env){
  let start=0,
      ret = smNode(ast),
      cmd= std.isVec(ast) ? "vector" : "list";
  if(std.isPair(ast,1)){
    start=1;
    switch(`${ast[0]}`){
      case "hashmap*": cmd="hash_DASH_map"; break;
      case "hashset*": cmd="hash_DASH_set"; break;
      case "vector*": cmd="vector"; break;
      case "object*": cmd="object"; break;
      case "list*": cmd="list"; break;
      default: start=0; break;
    }
  }
  for(let i=start;i<ast.length;++i){
    if(i>start)
      ret.add(",");
    ret.add(txExpr(ast[i]));
  }
  return wrap(ret, [kbStdRef(`${cmd}`),"("], ")");
}
//////////////////////////////////////////////////////////////////////////////
/** @private */
function quoteSingle(a){
  let rc;
  if(std.isKeyword(a)){
    //rc= [kbStdRef("keyword"),"(",`${a.value}`,")"].join("")
    rc=`${a}`;
  }else if(std.isSymbol(a)){
    //rc= [kbStdRef("symbol"),"(",`${a.value}`,")"].join("")
    rc=`${a}`
  }else if(a instanceof cc.Primitive){
    a = a.value;
    rc=std.isStr(a) ? std.quoteStr(a) : a===null ? "null" : `${a}`
  }else if(typeof(a) == "string"){
    rc=std.quoteStr(a)
  }else if(a || a===undefined){
    rc=`${a}`
  }else{
    rc="null"
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
//Returns the unevaluated form
function sfQuote(ast, env){
  assertArity(ast.length === 2, ast);
  //get rid of nested quotes, which is different to a repl,
  //repl will return (quote (quote (quote (1 2 3))))
  //''''(1 2 3) => '(1 2 3)
  return quoteXXX(evalQuote(ast), env);
}
cc.regSpecF("quote", sfQuote);
//////////////////////////////////////////////////////////////////////////////
/** @private */
function isPub(ast){
  return ! `${Array.isArray(ast) ? ast[0] : ast}`.endsWith("-") }
//////////////////////////////////////////////////////////////////////////////
//Define a Class
//(deftype Zebra [Animal] (foo [x] x) ...)
function sfDefType(ast, env){
  assertArity(ast.length >= 3, ast);
  if(!std.isSymbol(ast[1])) throwE("syntax-error", ast, "no class name");
  if(!std.isVec(ast[2])) throwE("syntax-error", ast, "no parent class");
  let par = ast[2][0],
      czn = ast[1],
      ret = smNode(ast),
      czname = txExpr(czn, env),
      pubQ = `${ast[0]}` == "deftype",
      [doc,mtds] = std.isStr(ast[3]) ? [ast[3], ast.slice(4)] : [null, ast.slice(3)];
  rt.addVar(czn, std.hashmap("ns", std.starNSstar()));
  ret.add([`class ${czname}`, (par ? ` extends ${txExpr(par, env)}` : ""), "{\n"]);
  for(let m1,mtd,m,i=0; i<mtds.length; ++i){
    //we use this hack to reuse code for handling "defn"
    mtd = std.symbol("method");
    m = mtds[i];
    m1 = m[0];
    xfi(m1, mtd);
    m.unshift(mtd);
    rt.addVar(`${czn}.${m1}`, std.hashmap("ns", std.starNSstar()));
    ret.add([sfFunc(m, env, false), "\n"]);
  }
  ret.prepend(writeDoc(doc));
  if(pubQ){
    cc._STAR_vars_STAR.push(czn);
    cc._STAR_externs_STAR.set(czname, czname); }
  return ret.add("}\n");
}
cc.regSpecF(["deftype", "deftype-"], sfDefType);
//////////////////////////////////////////////////////////////////////////////
//Defines a function. Use defn- to indicate privacy (no export).
//(defn name doc-string? attr-map? [params*] ...)
function sfFunc(ast, env){
  assertArity(ast.length >= 3, ast);
  let cmd= `${ast[0]}`,
      pubQ= cmd != "defn-",
      mtdQ= cmd == "method",
      fname0 = `${ast[1]}`,
      fname = `${txExpr(ast[1], env)}`,
      dotQ = fname.includes("."),
      ret = smNode(ast, tnode(fname)),
      [doc,pargs] = std.isStr(ast[2]) ? [ast[2], 3] : [null, 2],
      body = xfi(ast, ast.slice(pargs+1)),
      [attrs,args] = isTaggedMeta(ast[pargs], env);
  if(!std.isVec(args)) throwE("invalid-fargs", ast);
  if(!mtdQ)
    rt.addVar(fname0, std.hashmap("ns", std.starNSstar()));
  let pre,post,fargs = dstruFArgs(xfi(ast, args), env);
  attrs = attrs || new Map();
  if(cc.isAstMap(body[0]))
    for(let e2,e,b1=body[0],i = 1; i< b1.length; i+=2){
      e = b1[i];
      e2 = b1[i+1];
      if(std.isKeyword(e) && std.isVec(e2)){
        if(e == "post"){ post = e2 }
        if(e == "pre"){ pre = e2 }
      }
    }
  if(mtdQ){
    if(attrs.get("static"))
      ret.add("static ");
    ret.add(`${fname} (`);
    if(fname == "constructor")
      body.push(std.symbol("this"));
  }else if(dotQ){
    ret.add(`${fname} = function(`)
  }else{
    ret.add(`function ${fname}(`)
  }
  ret.add([fargs[0], "){\n", fargs[1]]);
  //deal with pre-post cond
  if(pre || post){
    body = body.slice(1);
    ret.add(writeFuncPre(xfi(ast, pre), env)) }
  //do the body
  ret.add([txDo(body, env, true), "}\n"]);
  ret.prepend(writeDoc(doc,attrs));
  if(pubQ && !dotQ && !mtdQ){
    cc._STAR_vars_STAR.push(fname0);
    cc._STAR_externs_STAR.set(fname, fname);
  }
  return ret.prepend(writeFuncInfo(fname0, ast));
}
cc.regSpecF(["defn","defn-"], sfFunc);
//////////////////////////////////////////////////////////////////////////////
//Handle comparison operators.
function sfCompOp(ast, env){
  //assertArity(ast.length >= 3, ast);
  let cmd = `${ast[0]}`,
      op, ret = smNode(ast);
  if(cmd == "not=")
    ast[0] = std.symbol("!==");
  if(cmd == "=")
    ast[0] = std.symbol("===");
  op = `${ast[0]}`;
  for(let i=1; i< ast.length-1; ++i){
    if(i > 1) ret.add(" && ");
    ret.add([txExpr(ast[i], env), " ", op, " ", txExpr(ast[i+1], env)]) }
  return wrap(ret, "(", ")");
}
cc.regSpecF([">", ">=", "<", "<=", "not=", "!=", "==", "="], sfCompOp);
//////////////////////////////////////////////////////////////////////////////
//Handles math operators
function sfArithOp(ast, env){
  assertArity(ast.length >= 2, ast);
  let e1 = `${ast[0]}`,
      cmd, ret = smNode(ast);
  switch(e1){
    case "unsigned-bit-shift-right": cmd = ">>>"; break;
    case "bit-shift-right": cmd = ">>"; break;
    case "bit-shift-left": cmd = "<<"; break;
    case "bit-and": cmd = "&"; break;
    case "bit-or": cmd = "|"; break;
    case "bit-not": cmd = "~"; break;
    case "bit-xor": cmd = "^"; break;
    case "rem": cmd = "%"; break;
    case "div": cmd = "/"; break;
    case "and": cmd = "&&"; break;
    case "or": cmd = "||"; break;
    case "exp": cmd = "**"; break;
    default: cmd = e1; break;
  }
  if("mod" == cmd){
    ret.add([kbStdRef("mod"), "(",
             txExpr(ast[1], env), ",", txExpr(ast[2], env), ")"])
  }else if("~" == cmd){
    ret.add(["~", txExpr(ast[1], env)]);
  }else{
    if("-" == cmd && 2 === ast.length){
      ret.add("-1 * ");
    }
    for(let i=1;i< ast.length; ++i){
      if(ast.length > 2 && i>1) ret.add(` ${cmd} `);
      ret.add(txExpr(ast[i], env))
    }
  }
  return wrap(ret, "(", ")");
}
cc.regSpecF(["bit-shift-left",
             "bit-shift-right",
             "unsigned-bit-shift-right",
             "or", "and", "exp", "rem", "+", "-", "*", "/",
             "div", "mod", "bit-and", "bit-or", "bit-not", "bit-xor"], sfArithOp);
//////////////////////////////////////////////////////////////////////////////
//Evaluates the expressions in order and returns the value of the last. If no
//expressions are supplied, returns nil.
function sfDo(ast, env){
  let ret = smNode(ast),
      stmtQ = isStmt(ast),
      e=exprHint(xfi(ast, ast.slice(1)), !stmtQ);
  ret.add(txDo(e, env, !stmtQ));
  return stmtQ ? wrap(ret, "if(true){\n", "\n}\n")
               : wrap(ret, "(function(){\n", "}).call(this)")
}
cc.regSpecF("do", sfDo);
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
function sfCase(ast, env){
  assertArity(ast.length >= 4, ast);
  let stmtQ = isStmt(ast),
      ret = smNode(ast),
      tst = ast[1],
      ms="",
      brk = ";\nbreak;\n",
      mv= `${std.gensym("M__")}`,
      gs= `${std.gensym("C__")}`,
      dft = isOdd(ast.length) ? ast.pop() : null;

  if(!dft)
    ms= `${mv}=true;\n`;

  for(let c,i=2; i< ast.length; i+=2){
    c = txExpr(ast[i+1], env);
    if(std.isPair(ast[i])){
      for(let c2 = ast[i], j=0; j<c2.length; ++j)
        ret.add(["case ", txExpr(c2[j], env), ":\n",
                 j === (c2.length-1) ? `${ms}${gs}=${c}${brk}` : ""]);
    }else{
      ret.add(["case ", txExpr(ast[i], env), ":\n", ms,gs, "=", c, brk])
    }
  }
  if(dft)
    ret.add(["default:\n", gs, "=", txExpr(dft, env), brk]);
  wrap(ret, ["switch(", txExpr(tst, env), "){\n"], "}");
  if(!dft)
    ret.add(`if(!${mv}){throw Error("IllegalArgumentException")}\n`);
  return stmtQ ?
    wrap(ret, `let ${gs},${mv};\n`, "") :
    wrap(ret, `(function(){let ${gs},${mv};\n`,
              ["return ", gs, ";}).call(this)"].join(""))
}
cc.regSpecF("case", sfCase);
//////////////////////////////////////////////////////////////////////////////
//Creates a variable with an initial value
function sfVar(ast, env){
  assertArity(isOdd(ast.length), ast);
  let vs = [],
      keys = new Map(),
      cmd = `${ast[0]}`,
      ret = smNode(ast),
      pubQ= cmd == "def" || cmd == "const";
  cmd = cmd.startsWith("const") ? "const"
                                : cmd == "locals" || cmd == "vars" ? "let" : "var";
  for(let i=1;i< ast.length; i+=2){
    let lhs = ast[i],
        rhs = ast[i+1],
        out = smNode(ast),
        x,rval = txExpr(rhs, env);
    if(std.isSymbol(lhs)){
      x = lhs;
      lhs = txExpr(lhs, env);
      if("let" != cmd)
        rt.addVar(`${x}`, std.hashmap("ns", std.starNSstar()));
      keys.set(lhs, lhs);
      vs.push(`${x}`);
      ret.add([cmd," ",lhs,"=",rval,";\n"]);
    }else{
      ret.add(["let ", txExpr(dstru(lhs,out,env),env), "=", rval, ";\n", out]);
    }
  }
  if(pubQ){
    vs.forEach(a=> cc._STAR_vars_STAR.push(a));
    keys.forEach((v,k)=> cc._STAR_externs_STAR.set(k,v)) }
  return ret;
}
cc.regSpecF(["const-", "const", "def-", "def", "vars", "locals"],sfVar);
////////////////////////////////////////////////////////////////////////////////
//Evaluates x and tests if it is an instance of the class
//c. Returns true or false.
//(inst? c x)
function sfInstQ(ast, env){
  assertArity(ast.length === 3, ast);
  return wrap(smNode(ast), null,
                           ["(", txExpr(ast[2], env),
                            " instanceof ", txExpr(ast[1], env), ")"]);
}
cc.regSpecF("inst?", sfInstQ);
//////////////////////////////////////////////////////////////////////////////
//Delete an object or property of an object.
function sfDelete(ast, env){
  assertArity(ast.length >= 2 && ast.length < 4, ast);
  let ret = smNode(ast);
  ret.add(["delete ", txExpr(ast[1], env)]);
  if(ast.length > 2)
    ret.add(["[", txExpr(ast[2], env), "]"]);
  return ret;
}
cc.regSpecF("delete!", sfDelete);
//////////////////////////////////////////////////////////////////////////////
//Remove a key from Map.
function sfDissocBANG(ast, env){
  assertArity(ast.length >= 3, ast);
  let ret=smNode(ast);
  for(let i=2;i<ast.length;++i){
    ret.add(",");
    ret.add(txExpr(ast[i],env));
  }
  return wrap(ret,
              [kbStdRef(`${rdr.jsid("dissoc!")}`), "(", txExpr(ast[1], env)], ")");
}
cc.regSpecF("dissoc!", sfDissocBANG);
//////////////////////////////////////////////////////////////////////////////
//The args, if any, are evaluated from left to right,
//and passed to the constructor of the class
//named by Classname. The constructed object is returned.
//e.g.
//(new Error 'a' 3)
function sfNew(ast, env){
  assertArity(ast.length >= 2, ast);
  return wrap(smNode(ast), "new ", txExpr(xfi(ast, ast.slice(1)), env));
}
cc.regSpecF("new", sfNew);
//////////////////////////////////////////////////////////////////////////////
//Throw an exception
function sfThrow(ast, env){
  assertArity(ast.length === 2, ast);
  let ret = smNode(ast),
      stmtQ = isStmt(ast);
  ret.add(["throw ", txExpr(xfi(ast, ast[1]), env)]);
  if(!stmtQ)
    wrap(ret, "(function(){ ", ";}).call(this)");
  return ret;
}
cc.regSpecF("throw", sfThrow);
//////////////////////////////////////////////////////////////////////////////
//Unary operator for increment & decrement
function sfXopop(ast, env){
  assertArity(ast.length === 2, ast);
  let cmd = `${ast[0]}`,
      a2 = txExpr(ast[1], env);
  return smNode(ast).add(cmd.endsWith("$") ? [a2, cmd.slice(0,-1)] : [cmd, a2]);
}
cc.regSpecF(["++", "--", "++$", "--$"], sfXopop);
//////////////////////////////////////////////////////////////////////////////
//Compound assignment operators
function sfXeq(ast, env){
  assertArity(ast.length === 3, ast);
  let cmd,a0 = `${ast[0]}`;
  switch(a0){
    case "unsigned-bit-shift-right=": cmd = ">>>="; break;
    case "bit-shift-right=": cmd = ">>="; break;
    case "bit-shift-left=": cmd = "<<="; break;
    case "bit-xor=": cmd = "^="; break;
    case "bit-or=": cmd = "|="; break;
    case "bit-and=": cmd = "&="; break;
    case "div=": cmd = "/="; break;
    case "rem=": cmd = "%="; break;
    case "exp=": cmd = "**="; break;
    default: cmd = a0; break;
  }
  return wrap(smNode(ast), "(", [txExpr(ast[1], env), " ", cmd, " ", txExpr(ast[2], env), ")"])
}
cc.regSpecF(["+=", "-=", "*=", "/=",
             "div=", "rem=", "exp=",
             "bit-and=",
             "bit-or=",
             "bit-xor=",
             "bit-shift-left=",
             "bit-shift-right=", "unsigned-bit-shift-right="], sfXeq);
//////////////////////////////////////////////////////////////////////////////
//Object property assignment or array index setter.
function sfAssocBANG(ast, env){
  assertArity(isEven(ast.length), ast);
  let ret = smNode(ast),
      obj = txExpr(ast[1], env);
  for(let i=2;i<ast.length;++i){
    ret.add(",");
    ret.add(txExpr(ast[i],env));
  }
  return wrap(ret, [kbStdRef(`${rdr.jsid("assoc!")}`), "(", txExpr(ast[1], env)], ")");
}
cc.regSpecF("assoc!", sfAssocBANG);
//////////////////////////////////////////////////////////////////////////////
//Object property assignment or array index setter.
function sfAssignBANG(ast, env){
  assertArity(isEven(ast.length), ast);
  let ret = smNode(ast),
      obj = txExpr(ast[1], env);
  for (let a,i=2;i< ast.length; i+=2){
    a= ast[i];
    if(i>2) ret.add(",");
    ret.add([obj,"[", txExpr(xfi(ast,a),env),"]", "=", txExpr(xfi(ast, ast[i+1]), env)]) }
  return wrap(ret, "(", ")");
}
cc.regSpecF(["oset!", "aset"], sfAssignBANG);
//////////////////////////////////////////////////////////////////////////////
//Set value(s) to variable(s).
//e.g. (set! a 2 b 4 ...)
function sfSet(ast, env){
  assertArity(isOdd(ast.length), ast);
  let ret = smNode(ast);
  for(let i=1;i< ast.length; i+=2){
    if(i>1) ret.add(",");
    ret.add([txExpr(ast[i], env), "=", txExpr(xfi(ast, ast[i+1]), env)]) }
  return wrap(ret, "(", ")");
}
cc.regSpecF(["set!", "var-set"], sfSet);
//////////////////////////////////////////////////////////////////////////////
//Defines an anonymous function. See defn.
//(fn attrs? [x y] ...)
function sfFN(ast, env){
  assertArity(ast.length >= 2, ast);
  let body = xfi(ast, ast.slice(2)),
      [X,args]= isTaggedMeta(ast[1], env);
  if(!std.isVec(args) && !std.isPair(args)) throwE("invalid-fargs", ast);
  let fargs = dstruFArgs(xfi(ast, args), env);
  return wrap(smNode(ast),
              null,
              ["function(", fargs[0], "){\n",
               fargs[1], txDo(body, env, true), "}"]);
}
cc.regSpecF("fn", sfFN);
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
function sfTry(ast, env){
  assertArity(ast.length >= 2, ast);
  let sz = ast.length,
      f = ast[ast.length-1],
      ret = smNode(ast),
      b,c,t,stmtQ = isStmt(ast);
  if(std.isPair(f,1) && std.isSymbol(f[0],"finally")){
    ast.pop();
    sz = ast.length;
    xfi(f[0], f);
  }else{
    f = null
  }
  //look for catch clause
  c = null;
  if(sz > 1)
    c = ast[sz-1];
  if(std.isPair(c,1) && std.isSymbol(c[0], "catch")){
    if(c.length < 2 ||
       !std.isSymbol(c[1])) throwE("invalid-catch", ast);
    ast.pop();
    xfi(c[0], c);
  }else{
    c = null
  }
  if(f === null &&
     c === null) throwE("invalid-try", ast);
  b= exprHint(xfi(ast, ast.slice(1)), !stmtQ);
  ret.add(["try{\n", txDo(b, env), "\n}"]);
  if(c){
    t = c[1];
    b= exprHint(xfi(c, c.slice(2)), !stmtQ);
    ret.add(["catch(", txExpr(t, env), "){\n", txDo(b, env), ";\n}\n"]) }
  if(f){
    b= exprHint(xfi(f, f.slice(1)), false);
    ret.add(["finally{\n", txDo(b, env, false), ";\n}\n"]); }
  if(!stmtQ)
    wrap(ret, "(function(){\n", "}).call(this)");
  return ret;
}
cc.regSpecF("try", sfTry);
//////////////////////////////////////////////////////////////////////////////
//Evaluates test. If truthy evaluates 'then' otherwise 'else'.
//(if test then else)
//(if test then)
function sfIf(ast, env){
  assertArity(ast.length >= 3, ast);
  let stmtQ = isStmt(ast),
      ret = smNode(ast),
      a1 = exprHint(xfi(ast, ast[1]), true),
      a2 = exprHint(xfi(ast, ast[2]), !stmtQ),
      mQ= ast.length > 3,
      a3 = mQ ? xfi(ast, ast[3]) : null,
      elze = mQ ? exprHint(a3, !stmtQ) : null;

  a1 = txExpr(a1, env);
  a2 = txExpr(a2, env);
  elze = txExpr(elze, env);

  return wrap(ret, null,
                   stmtQ ? ["if(", a1, "){\n", a2, ";\n}",mQ ? `else{\n${elze}\n}` : ""] :
                           ["(", a1, " ?\n", a2, " :\n",(elze || "null"), ")"])
}
cc.regSpecF("if", sfIf);
//////////////////////////////////////////////////////////////////////////////
//Returns the named property of an object,
//or value at the index of an array.
//(get obj "age")
//(aget obj 4)
//(nth obj 3)
function sfGet(ast, env){
  assertArity(ast.length === 3, ast);
  let ret = smNode(ast),
      a0 = `${ast[0]}`,
      cmd = kbStdRef("getProp");
  return a0 != "get" ?
    wrap(ret, null, [txExpr(xfi(ast, ast[1]), env), "[", txExpr(xfi(ast, ast[2]), env), "]"]) :
    wrap(ret, null, [cmd, "(", txExpr(xfi(ast, ast[1]), env), ",", txExpr(xfi(ast, ast[2]), env), ")"]);
}
cc.regSpecF(["oget", "nth", "get", "aget"],sfGet);
//////////////////////////////////////////////////////////////////////////////
//Creates a new list containing the args.
//(list "hello" "world")
//(list 1 2 3)
//[1 2 3]
//["hello" "world"]
function sfList(ast, env){
  let ret = smNode(ast);
  for(let i=1; i< ast.length; ++i)
    ret.add(txExpr(xfi(ast, ast[i]), env));
  ret.join(",");
  return wrap(ret, [kbStdRef("list"),"("],")");
}
cc.regSpecF(["list","list*"],sfList);
//////////////////////////////////////////////////////////////////////////////
//Creates a new vector containing the args.
//(vec "hello" "world")
//(vec 1 2 3)
//[1 2 3]
//["hello" "world"]
function sfArray(ast, env){
  let ret = smNode(ast);
  for(let i=1; i< ast.length; ++i){
    if(i>1)ret.add(",");
    ret.add(txExpr(xfi(ast, ast[i]), env));
  }
  return wrap(ret, [kbStdRef("vector"),"("],")");
}
cc.regSpecF(["vector","vector*"], sfArray);
//////////////////////////////////////////////////////////////////////////////
//Returns a new object with supplied key-mappings.
//(object "a" 1 "b" 2)
//{:a 1 :b 2}
function sfObjObj(ast, env){
  let ret = smNode(ast);
  for(let i=1;i< ast.length; i += 2){
    if(i>1)ret.add(",");
    ret.add([txExpr(ast[i], env), ",", txExpr(xfi(ast, ast[i+1]), env)]); }
  return wrap(ret, [kbStdRef("object"),"("],")");
}
cc.regSpecF(["object","object*","js-obj"],sfObjObj);
//////////////////////////////////////////////////////////////////////////////
function sfMapObj(ast, env){
  let ret = smNode(ast);
  for(let i=1;i< ast.length; i += 2){
    if(i>1)ret.add(",");
    ret.add([txExpr(ast[i], env), ",", txExpr(xfi(ast, ast[i+1]), env)]); }
  return wrap(ret, [kbStdRef(`${rdr.jsid("hash-map")}`),"("],")");
}
cc.regSpecF(["hash-map","hashmap*"], sfMapObj);
//////////////////////////////////////////////////////////////////////////////
//Returns a new Set.
//(set 1 2 3)
function sfSetObj(ast, env){
  let ret = smNode(ast);
  for(let i=1;i<ast.length; ++i){
    if(i>1)ret.add(",");
    ret.add(txExpr(ast[i], env));
  }
  return wrap(ret, [kbStdRef(`${rdr.jsid("hash-set")}`),"("],")");
}
cc.regSpecF(["hash-set","hashset*"], sfSetObj);
//////////////////////////////////////////////////////////////////////////////
function sfComment(ast, env){ return "" }
cc.regSpecF("comment", sfComment);
//////////////////////////////////////////////////////////////////////////////
/**For loop implementation
 * @private
 */
function wloop(ret, tst, body, env, stmtQ){
  let nb = std.pair(std.symbol("not"), std.symbol(BREAK));
  ret.add(`for(let ${BREAK}=false; `);
  xfi(ret, nb);
  tst = std.pair(std.symbol("and"), nb, tst);
  xfi(ret, tst);
  ret.add([txExpr(tst, env), ";", "){\n", txDo(body, env, false), "}\n"]);
  if(!stmtQ)
    wrap(ret, "(function(){\n", ";return null;}).call(this)");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
//Generates native for loop.
function sfWhile(ast, env){
  assertArity(ast.length >= 2, ast);
  let stmtQ = isStmt(ast),
      ret = smNode(ast),
      body = exprHint(xfi(ast, ast.slice(2)), false);
  return body.length===0 ? ret : wloop(ret, ast[1], body, env, stmtQ)
}
cc.regSpecF("while", sfWhile);
//////////////////////////////////////////////////////////////////////////////
/**Generic loop implementation
 * @private
 */
function foop(ret, cmd, args, body, env, stmtQ){
  let vars = std.pair(std.symbol(COLL), null, std.symbol(INDEX), 0);
  let indexer, tst, nb, sz, lvar, coll, start, end, step;
  let begin=0,recurs = [],
      incrQ= cmd == "floop", decrQ= cmd == "rloop";
  if(std.isSymbol(args[0])){
    lvar = args[0];
    coll = args[1];
    begin = 2;
    vars[1]=coll;
  }
  for(let es,e1,e,i = begin; i< args.length; i += 2){
    e = args[i];
    e1=args[i+1];
    switch(`${e}`){
      case "while": tst = e1; break;
      case "index": vars[2] = e1; break;
      case "recur": recurs = e1; break;
      case "start": start = e1; break;
      case "end": end = e1; break;
      case "step": step = e1; break;
      default:
        if(std.isSymbol(e)){ vars.push(e, e1) }
    }
  }
  //index variable
  indexer = vars[2];
  //start variable
  if(typeof(start) == "undefined"){
    if(incrQ){ start = 0 }
    if(decrQ)
      start = std.pair(std.symbol("-"), std.pair(std.symbol("n#"), std.symbol(COLL)), 1); }
  vars[3] = start;
  //end variable
  if(typeof(end) == "undefined")
    end = decrQ? -1 : incrQ? std.pair(std.symbol("n#"), std.symbol(COLL)) : null;
  vars.push( std.symbol(END), end);
  //test cond
  if(typeof(tst) == "undefined"){
    if(incrQ) tst = std.pair(std.symbol("<"), indexer, std.symbol(END));
    if(decrQ) tst = std.pair(std.symbol(">"), indexer, std.symbol(END)); }
  //start the for loop
  ret.add("for(");
  for(let e, i = 0; i< vars.length; i+=2){
    e = vars[i];
    if(i === 0) ret.add("let ");
    if(i>0) ret.add(",");
    ret.add([txExpr(e, env), "=", txExpr(vars[i+1], env)]);
  }
  ret.add([",", BREAK, "=false;"]);
  nb = std.pair(std.symbol("not"), std.symbol(BREAK));
  xfi(ret, nb);
  tst = typeof(tst) != "undefined" ? std.pair(std.symbol("and"), nb, tst) : nb;
  xfi(ret, tst);
  ret.add([txExpr(tst, env), "; "]);
  //incr or decr
  if(typeof(step) == "undefined"){ step = 1 }
  if(incrQ) recurs.unshift(std.pair(std.symbol("+"), indexer, step));
  if(decrQ) recurs.unshift(std.pair(std.symbol("-"), indexer, step));
  for(let e,i = 0, k = 2; i< recurs.length; ++i, k += 2){
    e = recurs[i];
    if(i>0) ret.add(",");
    ret.add([txExpr(vars[k], env), "=", txExpr(e, env)]);
  }
  //the for loop body
  ret.add(["){\n",(typeof(lvar) != "undefined" ?
    sfVar(xfi(args, std.pair(std.symbol("vars"), lvar,
                             std.pair(std.symbol("nth"), std.symbol(COLL), indexer))), env) : ""), txDo(body, env, false), "}\n"]);
  if(!stmtQ)
    wrap(ret, "(function(){\n", ";return null; }).call(this)");
  return ret;
}
//////////////////////////////////////////////////////////////////////////////
/**Generates native for loop.
 * (floop [c coll :start 0 :step 3 :index k] ...)
 * (floop [:start 0 :end 10 :step 3 :index k] ...)
 */
function sfForXXX(ast, env){
  assertArity(ast.length >= 2, ast);
  let stmtQ = isStmt(ast),
      ret = smNode(ast),
      body = exprHint(xfi(ast, ast.slice(2)), false);
  if(!std.isVec(ast[1]) && !std.isPair(ast[1]))
    throwE("syntax-error",ast,"for loop error");
  return body.length===0 ?
    ret :
    foop(ret, `${ast[0]}`, xfi(ast, ast[1]), body, env, stmtQ)
}
cc.regSpecF(["floop","rloop"], sfForXXX);
//////////////////////////////////////////////////////////////////////////////
//Inject raw native code fragment.
//(raw# "console.log('hi');")
function sfJSCode(ast, env){
  assertArity(ast.length >= 2, ast);
  let s = `${ast[1]}`,
      name = rdr.jsid("sf-jscode");
  return smNode(ast, tnode(name, s.endsWith("\"") && s.startsWith("\"") ? s.slice(1, -1) : s));
}
cc.regSpecF("raw#", sfJSCode);
//////////////////////////////////////////////////////////////////////////////
function sfStr(ast,env){
  let ret = smNode(ast);
  for(let i=1; i< ast.length; ++i)
    ret.add(txExpr(xfi(ast, ast[i]), env));
  ret.join(",");
  return wrap(ret, [kbStdRef("str"),"("],")");
}
cc.regSpecF("str", sfStr);
//////////////////////////////////////////////////////////////////////////////
//Like defn, but the resulting function name is declared as a
//macro and will be used as a macro by the compiler when it is
//called.
//(defmacro macro-name [args] ...)
function sfMacro(ast, env){
  assertArity(ast.length >= 4, ast);
  let pms = [], args = ast[2],
      mname, mobj, doc, body = ast.slice(3);
  if(typeof(args) == "string"){
    doc = args;
    args = ast[3];
    body = ast.slice( 4);
  }
  [mobj,args] = isTaggedMeta(args, env);
  for(let e1,ev,e, i = 0; i<args.length; ++i){
    e = args[i];
    ev = `${e}`;
    e1=args[i+1];
    if(ev == "&"){
      if(std.isVec(e1)){
        e = e1;
        ++i;
        for(let x,j = 0;j< e.length; ++j){
          x = e[j];
          if(!std.isSymbol(x))
            throwE("syntax-error", ast);
          pms.push(x)
        }
      }else{
        pms.push(e, e1);
        ++i;
      }
    }else if(!std.isSymbol(e)){
      throwE("syntax-error", ast)
    } else {
      pms.push(e)
    }
  }
  mname = ast[1];
  ast = std.pair(std.symbol("macro*"), mname, pms, body[0]);
  rt.addVar(mname, std.hashmap("ns", std.starNSstar()));
  if(mobj && mobj.get("private") === true){}else{
    cc._STAR_macros_STAR.set(mname, std.prn(ast, true))
  }
  rt.compute(ast, env);
  return "";
}
cc.regSpecF("defmacro", sfMacro);
//////////////////////////////////////////////////////////////////////////////
//Special unary operators.
function sfUnary(ast, env){
  assertArity(ast.length === 2, ast);
  let [a0,a1] = ast;
  if(a0 == "not"){ a0 = std.symbol("!") }
  return smNode(ast).add(["(", `${txExpr(a0, env)}`,
                                `${txExpr(a1, env)}`, ")"]);
}
cc.regSpecF(["not","!"], sfUnary);
//////////////////////////////////////////////////////////////////////////////
//List comprehension. Takes a vector of one or more
//binding-form/collection-expr pairs, each followed by zero or more
//modifiers, and yields a lazy sequence of evaluations of expr.
//Collections are iterated in a nested fashion, rightmost fastest,
//and nested coll-exprs can refer to bindings created in prior
//binding-forms.  Supported modifiers are: :let [binding-form expr ...],
//:while test, :when test.
function sfListC(ast, env){
  let cap = std.gensym();
  return wrap(smNode(ast), ["(function(){\n", "let ", `${cap}`, "=[];\n"],
                           [sfDoseq(exprHint(ast, false), env, cap), "return ", `${cap}`, ";\n}).call(this)"]);
}
cc.regSpecF("for", sfListC);
//////////////////////////////////////////////////////////////////////////////
/** @private */
function doseqBinds(whileQ, ret, binds, body, ast, env, capRes){
  let patch = smNode(ast);
  std.partition(2, binds).forEach(function([k,expr]){
    switch(k.toString()){
      case "let":
        if(cc.isAstVec(expr)){
          expr=vecFromAstVec(expr)
        }
        ret.add(sfVar(xfi(ast, std.cons(std.symbol("vars"), expr))));
        break;
      case "when":
        ret.add(["if(", txExpr(expr, env), "){\n"]);
        patch.add("}\n");
        break;
      case "while":
        ret.add(["if(!(", txExpr(expr, env), ")){ ", `${whileQ}`, "=false; ____break=true; }else{\n"]);
        patch.add("}\n");
        break;
    }
  });
  if(capRes){
    exprHint(body, true);
    ret.add([`${capRes}`, ".push((function(){\n", txDo(body, env, true), "\n}).call(this));\n"]);
  }else{
    ret.add(txDo(body, env, false));
  }
  return ret.add(patch);
}
//////////////////////////////////////////////////////////////////////////////
//Repeatedly executes body (presumably for side-effects) with
//bindings and filtering as provided by "for".  Does not retain
//the head of the sequence. Returns nil.
function sfDoseq(ast, env,capRes){
  let kount = kbStdRef("count"),
      whileQ= std.gensym(),
      inner = "", fst = true,
      args = ast[1], stmtQ = isStmt(ast),
      ret, body = exprHint(xfi(ast, ast.slice(2)), false);

  if(isOdd(args.length))
    throwE("syntax-error", ast, "doSeq: bindings not even");

  let [x,y] = std.splitWith(a=> !std.isKeyword(a), args);
  let arr = std.rseq(std.partition(2, x));
  let recur = null,
      _x_ = null,
      _f_ = function(p1, pn){
        if(p1){
          let eQ= std.gensym(), nQ= std.gensym();
          ret = smNode(ast);
          ret.add(["for(let ", `${nQ}`, "=0,",0 === std.count(pn) ? `${whileQ}=true,` : "",
                   `${eQ}`, "=", txExpr(p1[1], env), ",____sz=", kount, "(", `${eQ}`, ")",
                   (fst ? `,${BREAK}=false` : ""), "; (",(fst ? `!${BREAK} && ` : ""),
                   `${whileQ}`, " && ", "(", `${nQ}`, " < ____sz)", "); ++", `${nQ}`, "){\n"]);
          ret.add(sfVar(xfi(ast, std.pair(std.symbol("vars"), p1[0], std.pair(std.symbol("nth"), eQ, nQ))), env));
          if(fst){
            fst = false;
            doseqBinds(whileQ, ret, y, body, ast, env, capRes);
          }else{ ret.add(inner); }
          ret.add("}\n");
          inner = ret;
          return std.notEmpty(pn) ? recur(pn[0], pn.slice(1)) : null;
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
    wrap(ret, "(function(){\n", "; return null; }).call(this)");
  return ret;
}
cc.regSpecF("doseq", sfDoseq);


//////////////////////////////////////////////////////////////////////////////
module.exports = {
};

//////////////////////////////////////////////////////////////////////////////
//EOF

