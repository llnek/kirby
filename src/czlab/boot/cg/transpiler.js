// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var macros=require("../bl/macros"),
    types=require("../bl/types"),
    std=require("../bl/stdlib"),
    tn=require("../bl/tnode"),
    rdr=require("../bl/lexer"),
    path=require("path"),
    esfmt = require('esformatter'),
    fs=require("fs"),
    psr=require("../bl/parser"),
    rt=require("../rt/runtime");

var tnodeEx=tn.tnodeEx;
var tnode=tn.tnode;
var gensym_counter=1;
var MATH_OP_REGEX = /^[-+/*][0-9]+$/;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function gensym(pfx) {
  let x= gensym_counter;
  gensym_counter++;
  return (pfx || "G____") + x;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var ERRORS_MAP= {
  e0: "Syntax Error",
  e1: "Empty statement",
  e2: "Invalid characters in function name",
  e3: "End of File encountered, unterminated string",
  e4: "Closing square bracket, without an opening square bracket",
  e5: "End of File encountered, unterminated array",
  e6: "Closing curly brace, without an opening curly brace",
  e7: "End of File encountered, unterminated javascript object '}'",
  e8: "End of File encountered, unterminated parenthesis",
  e9: "Invalid character in var name",
  e10: "Extra chars at end of file. Maybe an extra ')'.",
  e11: "Cannot Open include File",
  e12: "Invalid no of arguments to ",
  e13: "Invalid Argument type to ",
  e14: "End of File encountered, unterminated regular expression",
  e15: "Invalid vararg position, must be last argument.",
  e16: "Invalid arity (args > expected) to ",
  e17: "Invalid arity (args < expected) to " };

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var RESERVED= {
"compare": ["not=","!=","==","=",">",">=","<","<="],
"arith": ["+","-","*","div","%", "mod"],
"logic": ["||","&&"],
"bitwise": ["^","&","|","<<",">>",">>>"],
"incdec": ["++","--"],
"unary": ["not", "~","!"],
"assign": ["+=","-=","*=",
         "/=","%=","<<=",
         ">>=",">>>=","&=","|=","^="],
"builtin":
  ["quote","syntax-quote","quasi-quote",
  "backtick", "unquote", "unquote-splice",
  "repeat-n", "do", "doto", "case","apply",
  "range", "def-", "def", "var", "forlet",
  "new", "throw", "while", "lambda",
  "inst?", "delete!",
  "aset", "set!", "fn", "set-in!",
  "defn-", "defn",
  "try", "if", "get", "aget", "str",
  "list", "[", "vec", "{", "hash-map",
  "ns", "comment", "for", "cons",
  "js#", "macro", "defmacro"]};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var MODULE_VERSION= "1.0.0",
    tabspace= 2,
    indent= -tabspace,
    EXTERNS=null,
    NSPACES=null;
var SPEC_OPS={};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function regoBuiltins(f ,group) {
  RESERVED[group].forEach(function(k) { SPEC_OPS[k]= f; });
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function error_E(e, line, file, msg) {
  throw new Error("" + ERRORS_MAP[e] +
                  (msg ? " : "+msg : "") +
                  (line ? "\nLine no "+line : "") +
                  (file ? "\nFile "+file : ""));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function syntax_E(ecode, ast, cmd) {
  error_E(ecode,
          (ast ? ast.line : 0),
          (ast ? ast.source : 0), cmd);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function pad(z) { return " ".repeat(z); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function testre_Q(re, x) { return x ? re.test(x) : false; }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function nodeTag(obj, src) {
  if (obj && src && typeof obj !== "boolean" &&
      typeof obj !== "number") {
    obj.source= src.source;;
    obj.column= src.column;
    obj.line= src.line;
  }
  return obj;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileTree(root, env) {
  let ret= nodeTag(tnode(), root);
  let pstr= "",
      endx= root.length-1,
      treeSize= root.length;

  indent += tabspace;
  pstr= pad(indent);

  root.forEach(function(ast) {
    let tmp=ast;
    if (std.array_p(ast)) {
      tmp= transpileList(ast, env);
    }
    if (tmp) {
      ret.add([pstr, tmp, "\n"]);
    }
  });
  indent -= tabspace;
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileAtoms(atoms, env) {
  atoms.forEach(function(a,i,arr){
    if (std.array_p(a)) {
      arr[i]= transpileList(a, env);
    } else {
      arr[i]=transpileSingle(a);
    }
  });
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileSingle(a) {
  if (types.symbol_p(a)) {
    return rdr.jsid(types.symbol_s(a));
  }
  if (types.keyword_p(a)) {
    return "\"" + types.keyword_s(a) + "\"";
  }
  if (types.lambda_arg_p(a)) {
    return "____args[" + types.lambda_arg_s(a) + "]";
  }
  if (std.string_p(a)) {
    return a;
  }
  if (a===null) {
    return "null";
  }
  return ""+a;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function eval_QQ(x,env) {
  return std.array_p(x) ?
         transpileList(x, env) : transpileSingle(x);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function findCmd(ast) {
  let cmd="";
  if (types.vector_p(ast)) { cmd="["; }
  else if (types.map_p(ast)) { cmd="{"; }
  else if (types.list_p(ast)) {
    cmd= types.symbol_s(ast[0]);
  } else { cmd=""}
  return cmd;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function quoteSingle(a) {
  if (types.keyword_p(a)) {
    return "\"" + types.keyword_s(a) + "\"";
  }
  if (types.symbol_p(a)) {
    return rdr.jsid(types.symbol_s(a));
  }
  if (std.string_p(a)) {
    return a;
  }
  if (a===null) {
    return "null";
  }
  return ""+a;
}

function quote_QQ(a,env) {
  if (Array.isArray(a))  {
    return types.map_p(a) ? quoteMap(a,env) : quoteBlock(a,env);
  } else {
    return quoteSingle(a);
  }
}

function quoteMap(a,env) {
  let ret=tnode();
  for (let i=0; i < a.length; i+=2) {
    if (i > 0) { ret.add(","); }
    ret.add([quote_QQ(a[i],env), " : ", quote_QQ(a[i+1],env)]);
  }
  ret.prepend("{");
  ret.add("}");
  return ret;
}

function quoteBlock(a,env) {
  let ret=tnode();
  for (let i=0; i < a.length; ++i) {
    if (i > 0) { ret.add(","); }
    ret.add(quote_QQ(a[i],env));
  }
  ret.prepend("[");
  ret.add("]");
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_quote(ast,env) {
  let ret=nodeTag(tnode(),ast);
  ret.add(quote_QQ(ast[1], env));
  return ret;
}
SPEC_OPS["quote"]=sf_quote;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileList(ast, env) {
  let ret=tnode();
  let cmd= "",
      mc= null,
      tmp= null;
  cmd=findCmd(ast);
  mc= macros.get(cmd);

  if (mc) {
    ast=rt.expandMacro(ast, env, mc);
    cmd= findCmd(ast);
  }

  if (cmd == "with-meta") {
    let a1=ast[1];
    if (! simpleton(a1)) {
      a1.____meta=resolveMeta(ast[2],env);
      return eval_QQ(a1,env);
    } else {
      throw new Error("cant with-meta simple value");
    }
  }

  if (cmd.startsWith(".-")) {
    let c= transpileSingle(types.symbol(cmd.slice(2)));
    ret.add([eval_QQ(ast[1],env), ".",c]);
  }
  else if ("." === cmd.charAt(0)) {
    ret.add(eval_QQ(ast[1],env));
    ret.add([cmd, "("]);
    for (var n=2; n < ast.length; ++n) {
      if (n !== 2) ret.add(",");
      ret.add(eval_QQ(ast[n],env));
    }
    ret.add(")");
  }
  else if (SPEC_OPS.hasOwnProperty(cmd)) {
    ret = (SPEC_OPS[cmd])(ast, env);
  }
  else if (rdr.REGEX.int.test(cmd)) {
    let c0=cmd.charAt(0);
    if (c0 != "-" && c0 != "+") {
      cmd="+"+cmd;
    }
    ast= [types.symbol(cmd.charAt(0)),
          ast[1],
          parseInt(cmd.slice(1))];
    cmd=""+ast[0];
    ret = (SPEC_OPS[cmd])(ast, env);
  }
  else {
    if (types.list_p(ast)) {
      transpileAtoms(ast, env);
      cmd=ast[0];
    } else {
      cmd=transpileSingle(ast);
    }
    if (!cmd) syntax_E("e1", ast);
    if (types.list_p(ast)) {
      if (testre_Q(rdr.REGEX.func, cmd)) {
        cmd = tnodeEx(["(", cmd, ")"]);
      }
      ret.add([cmd,
               "(",
               tnodeEx(ast.slice(1)).join(","), ")"]);
    } else {
      ret.add(cmd);
    }
  }
  return nodeTag(ret,ast);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_deftype(ast,env,publicQ) {
  let ret=nodeTag(tnode(),ast),
      cz=eval_QQ(ast[1],env),
      par=ast[2][0],
      args=ast[3],
      mtds=ast.slice(4);
  ret.add(["class ", cz]);
  if (par) {
    ret.add([" extends ", eval_QQ(par,env)]);
  }
  ret.add(" {\n");
  for (let i=0,n=null,m=null; i < mtds.length; ++i) {
    m=mtds[i];
    m.unshift(types.symbol("method"));
    ret.add(sf_func(m,env,false));
    ret.add("\n");
  }
  ret.add("}\n");
  if (publicQ &&
    (1=== NSPACES.length)) {
      EXTERNS[cz]=cz;
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
SPEC_OPS["deftype-"]=function(ast,env) { return sf_deftype(ast,env,false); }
SPEC_OPS["deftype"]=function(ast,env) { return sf_deftype(ast,env,true); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var _lambdaFuncCount=0;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_lambda(ast,env) {
  if (_lambdaFuncCount !== 0) {
    throw new Error("Cant nest lambdas");
  }
  ++_lambdaFuncCount;
  let x=[types.symbol("fn"),
         types.vector(),
         ["var", "____args",
           "Array.prototype.slice.call(arguments)"].map(function(s) {
             return types.symbol(s);
           })];
  let body=ast[1];
  if (body.length===0) { body=[null]; }
  if (body.length===1 &&
      types.value_p(body[0])) {
  } else {
    body= ast.slice(1);
  }
  x=x.concat(body);
  try {
    return sf_fn(x,env);
  } finally {
    --_lambdaFuncCount;
  }
}
SPEC_OPS["lambda"]=sf_lambda;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_apply(ast,env) {
  let args= ast.slice(2),
      f=ast[1],
      ret=nodeTag(tnode(),ast);
  for (var i=0; i < args.length; ++i) {
    ret.add(eval_QQ(args[i],env));
  }
  if (args.length > 1) ret.join(",");
  ret.prepend("[");
  ret.add("]");
  ret.prepend([eval_QQ(f,env), ".apply(this,"]);
  ret.add(")");
  return ret;
}
SPEC_OPS["apply"]=sf_apply;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_compOp(ast, env) {
  let cmd=ast[0];
  if (cmd == "not=" || cmd == "!=") ast[0]= types.symbol("!==");
  if (cmd == "=") ast[0]= types.symbol("===");

  let ret= nodeTag(tnode(),ast);
  transpileAtoms(ast, env);
  for (var i= 0,
       op= ast.shift(); i < ast.length-1; ++i) {
    ret.add(tnodeEx([ast[i],
                     " ",
                     op,
                     " ",
                     ast[i+1]]));
  }
  ret.join(" && ");
  ret.prepend("(");
  ret.add(")");
  return ret;
}
regoBuiltins(sf_compOp,"compare");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_arithOp(ast,env) {
  let ret= nodeTag(tnode(),ast);
  transpileAtoms(ast, env);
  let op= tnode(),
      e1= ast.shift(),
      cmd= types.symbol_s(e1);

  if (cmd == "mod") cmd="%";
  if (cmd == "div") cmd="/";

  if (1 === ast.length) {
    if ("-" == cmd) { ret.add("-"); }
  } else {
    op.add(["", cmd, ""]);
  }
  ret.add(ast);
  if (ast.length > 1) ret.join(op);
  ret.prepend("(");
  ret.add(")");
  return ret;
}
regoBuiltins(sf_arithOp,"bitwise");
regoBuiltins(sf_arithOp, "logic");
regoBuiltins(sf_arithOp, "arith");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_repeat(ast, env) {
  transpileAtoms(ast,env);
  let ret= nodeTag(tnode(),ast);
  for (var i= 0,
       end= parseInt(ast[1]);
       i < end; ++i) {
    if (i !== 0) ret.add(",");
    ret.add(ast[2]);
  }
  ret.prepend("[");
  ret.add("]");
  return ret;
}
SPEC_OPS["repeat-n"]=sf_repeat;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileDo(ast,env,return_Q) {
  let p= pad(indent),
      e=null,
      end= ast.length-1;
  let ret=nodeTag(tnode(),ast);
  for (var i= 0; i < end; ++i) {
    e= ast[i];
    ret.add([p, transpileList(e,env), ";\n"]);
  }
  if (end >= 0) {
    e= eval_QQ(ast[end], env);
    if (return_Q === false) {
      ret.add([p, e, ";\n"]);
    } else {
      ret.add([p, "return ", e, ";\n"]);
    }
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_do (ast,env) {
  let ret=nodeTag(tnode(),ast);
  let p= pad(indent);
  ret.add(p + "(function() {\n");
  ret.add(transpileDo(ast.slice(1),env));
  ret.add(""+ p + "}).call(this)");
  return ret;
}
SPEC_OPS["do"]=sf_do;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_case(ast, env) {
  let ret= nodeTag(tnode(),ast);
  let tst= ast[1],
      e =null, t= null, c=null, dft=null;
  if (std.odd_p(ast.length)) {
    dft= ast.pop();
  }
  for (var i=2;
       i < ast.length; i += 2) {
    c= ast[i+1];
    e= ast[i];
    if (types.list_p(e)) {
      for (var j=0;
           j < e.length; ++j) {
        ret.add(["case ", transpileSingle(e[j]), ":\n"]);
        if (j === (e.length-1))
          ret.add(["____x= ",
                   eval_QQ(c,env), ";\nbreak;\n"]);
      }
    } else {
      ret.add(["case ", transpileSingle(e), ":\n"]);
      ret.add(["____x= ",
               eval_QQ(c), ";\nbreak;\n"]);
    }
  }
  if (dft) {
    ret.add("default:\n");
    ret.add(["____x= ",
             eval_QQ(dft), ";\nbreak;\n"]);
  }
  ret.prepend(["switch (",
               eval_QQ(tst,env), ") {\n"]);
  ret.add("}\n");
  ret.prepend("(function() { let ____x;\n");
  ret.add("return ____x;}).call(this)");
  return ret;
}
SPEC_OPS["case"]=sf_case;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_range (ast,env) {
  if (ast.length < 2 || ast.length > 4) syntax_E("e0",ast);

  let len= 0, start= 0, step= 1, end= 0;
  let ret= nodeTag(tnode(),ast);

  transpileAtoms(ast,env);
  len=ast.length;
  end= parseInt(ast[1]);

  if (len > 2) {
    start= parseInt(ast[1]);
    end= parseInt(ast[2]);
  }

  if (len > 3)
    step= parseInt(ast[3]);

  for (var i= start; i< end; i += step) {
    if (i !== start) ret.add(",");
    ret.add("" +  i);
  }
  ret.prepend("[");
  ret.add("]");
  return ret;
}
SPEC_OPS["range"]=sf_range;


function sf_vardefs(ast,env,cmd) {
  let s, kks={}, ret=nodeTag(tnode(),ast);
  let publicQ=("global" == cmd);
  if ("let" == cmd) {}  else { cmd="var"; }
  for (var i=1; i<ast.length;++i) {
    s= transpileSingle(ast[i]);
    ret.add(s + "=undefined");
    kks[s]=null;
  }
  ret.join(",");
  ret.prepend(cmd + " ");
  ret.add(";\n");

  if (publicQ &&
             (1=== NSPACES.length))
    Object.keys(kks).forEach(function(s){
      EXTERNS[s]=s;
    });

  return ret;
}

SPEC_OPS["def~-"]= function (ast,env) { return sf_vardefs(ast, env, "local"); };
SPEC_OPS["def~"]= function (ast,env) { return sf_vardefs(ast,env, "global"); };
SPEC_OPS["var~"]= function (ast,env) { return sf_vardefs(ast,env, "let"); };

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_var (ast, env, cmd) {
  let vname=null, publicQ= ("global" == cmd);
  let ret=nodeTag(tnode(),ast);

  ast=ast.slice(1);
  if (publicQ ||
          ("local" == cmd)) cmd="var";

  let kks={}, keys=[];
  for(var i=0;i<ast.length;i+=2) {
    if (types.symbol_p(ast[i])) {
      keys.push(ast[i]);
    }
  }
  if (keys.length > 0) {
    ret.add(["let ",
             keys.map(function(s) {
               let ss= transpileSingle(s);
               kks[ss]=null;
               return ss; }).join(","), ";\n"]);
  }
  for(var rc=null, i=0,lhs=null,rhs=null; i < ast.length; i=i+2) {
    rhs=ast[i+1];
    lhs=ast[i];
    if (types.symbol_p(lhs)) {
      ret.add([transpileSingle(lhs), "= ", eval_QQ(rhs,env), ";\n"]);
    } else {
      rc=destruct0(cmd,lhs,rhs,env);
      ret.add(rc[0]);
      rc[1].map(function(s) {
        kks[rdr.jsid(s)]=null;
      });
    }
  }
  if (publicQ &&
             (1=== NSPACES.length))
    Object.keys(kks).forEach(function(s){
      EXTERNS[s]=s;
    });

  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
SPEC_OPS["def-"]= function (ast,env) { return sf_var(ast, env, "local"); };
SPEC_OPS["def"]= function (ast,env) { return sf_var(ast,env, "global"); };
SPEC_OPS["var"]= function (ast,env) { return sf_var(ast,env, "let"); };

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_inst_Q (ast,env) {
  let ret= nodeTag(tnode(),ast);
  ret.add(["(",
           eval_QQ(ast[2]),
           " instanceof ",
           eval_QQ(ast[1]), ")"]);
  return ret;
}
SPEC_OPS["inst?"]=sf_inst_Q;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_delete(ast,env) {
  let ret= nodeTag(tnode(),ast);
  if (ast.length === 2) {
    ret.add(["delete ", eval_QQ(ast[1])]);
  } else if (ast.length === 3) {
    ret.add(["delete ",
             eval_QQ(ast[1]),
             "[", eval_QQ(ast[2]), "]"]);
  }
  return ret;
}
SPEC_OPS["delete!"]=sf_delete;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_new(ast,env) {
  let ret= nodeTag(tnode(),ast);
  ret.add(transpileList(ast.slice(1),env));
  ret.prepend("new ");
  return ret;
}
SPEC_OPS["new"]=sf_new;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_throw(ast,env) {
  let ret= nodeTag(tnode(),ast);
  ret.add(["throw ", eval_QQ(ast[1]), ";"]);
  ret.prepend("(function (){ ");
  ret.add(" }).call(this)");
  return ret;
}
SPEC_OPS["throw"]=sf_throw;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_x_opop(ast,env) {
  transpileAtoms(ast,env);
  return nodeTag(tnodeEx([ast[0],
                          ast[1]]),ast);
}
regoBuiltins(sf_x_opop,"incdec");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_x_eq(ast,env) {
  transpileAtoms(ast,env);
  return nodeTag(
           tnodeEx([ast[1],
                    " ", ast[0], " ", ast[2]]));
}
regoBuiltins(sf_x_eq,"assign");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_set_in(ast,env) {
  assert(std.even_p(ast.length), "set-in: bad arg count");
  let ret= nodeTag(tnode(),ast),
      obj= eval_QQ(ast[1],env);
  for (let i=2; i < ast.length; i += 2) {
    if (i > 2) { ret.add(","); }
    ret.add([obj, "[", eval_QQ(ast[i],env), "]",
             "=", eval_QQ(ast[i+1],env)]);
  }
  return ret;
}

SPEC_OPS["set-in!"]=sf_set_in;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function assert(tst) {
  if (! tst) throw new Error(
    Array.prototype.slice.call(arguments,1).join("")
  );
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_set(ast,env) {
  assert(std.odd_p(ast.length), "set: bad arg count");
  let ret= nodeTag(tnode(),ast);
  for (let i=1; i < ast.length; i += 2) {
    if (i > 1) { ret.add(","); }
    ret.add([eval_QQ(ast[i],env),
             "=",
             eval_QQ(ast[i+1],env)]);
  }
  return ret;
}
SPEC_OPS["set!"]=sf_set;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_fn(ast,env) {
  let fargs, args=ast[1],
      hints={},
      body= ast.slice(2),
      ret= nodeTag(tnode(),ast);

  if (args.length===3 &&
    args[0]=="with-meta" && Array.isArray(args[1])) {
    hints=resolveMeta(args[2],env);
    args=args[1];
  }

  fargs=handleFuncArgs(parseFuncArgs(args),env);
  ret.add("function (");
  ret.add(fargs[0]);
  ret.add([") {\n", fargs[1],
           transpileDo(body,env),
           pad(indent), "}"]);
  return ret;
}
SPEC_OPS["fn"]=sf_fn;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function parseFuncArgs(args) {
  let ret=[];

  for (var i=0,e=null; i < args.length; ++i) {
    e= args[i];
    if (types.symbol_p(e)) {
      if (e == "_") {
        ret.push(types.symbol(gensym("_")));
      } else if (e == "&") {
        e= args[i+1];
        if (types.symbol_p(e)) {
          ret.push([e,i,e]);
        } else {
          ret.push([types.symbol("&"+gensym()),i,e]);
        }
        ++i;
      } else if ((""+e).startsWith("&")) {
        e=types.symbol((""+e).slice(1));
        ret.push([e, i, e]);
      } else {
        ret.push(e);
      }
    } else if (types.keyword_p(e)) {
      throw new Error("bad function args destructure: " +
                      types.obj_type(e));
    } else if (types.vector_p(e)) {
      ret.push([types.symbol(gensym()), i, e]);
    } else if (types.map_p(e)) {
      ret.push([types.symbol(gensym()), i, e]);
    } else {
      throw new Error("bad function args destructure: " +
                      types.obj_type(e));
    }
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function handleFuncArgs(fargs,env) {
  let misc=[], keys=[], ret=tnode();

  fargs.forEach(function(arg){
    if (types.symbol_p(arg)) {
      keys.push(arg);
    } else if (types.symbol_p(arg[0]) &&
               !(""+arg[0]).startsWith("&") && std.array_p(arg[2])) {
      keys.push(arg[0]);
      misc.push(arg);
    }
    else { misc.push(arg); } });

  misc.forEach(function(arr) {
    let a0=arr[0],
        name=a0.toString(),
        varg_p=name.startsWith("&"),
        pos="" + arr[1], a2=arr[2];
    if (varg_p) { name=name.slice(1); }
    name=rdr.jsid(name);
    if (types.symbol_p(a0) && types.symbol_p(a2)) {
      ret.add(["let ",
               name,
               "=Array.prototype.slice.call(arguments,", pos, ");\n"]);
    } else if (std.array_p(a2)) {
      if (varg_p) {
        ret.add(["let ",
                 name,
                 "=Array.prototype.slice.call(arguments,", pos, ");\n"]);
      }
      ret.add(destruct0("let",a2,name,env)[0]);
    }
  });

  let knode=tnode();
  knode.add(keys.map(function(k) {
    return rdr.jsid(""+k); }).join(","));

  return [knode,ret];
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function fmtRegoSpecOps(alias,fname) {
  return "SPEC_OPS[\"" + alias + "\"] = " + fname;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function fmtSpecOps(fname, attrs) {
  let ks= attrs["opcode"] || [];
  let out=ks.map(function(s) {
    return fmtRegoSpecOps(""+s, fname);
  }).join(";\n");
  return (ks.length > 0) ? out + ";\n" : out;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_func(ast,env,publicQ) {
  let fname = eval_QQ(ast[1],env),
      mtdQ= (ast[0] == "method"),
      dotQ= fname.includes("."),
      hints={},
      e2= ast[2],
      doc=null, args= 2, body= 3;
  if (types.list_p(e2)) {}
  else if (std.string_p(e2)) {
    doc= 2;
    args= 3;
  }
  body= args+1;
  if (doc) doc= ast[doc];
  args= ast[args];
  body= ast.slice(body);

  if (args.length===3 &&
    args[0]=="with-meta" && Array.isArray(args[1])) {
    hints=resolveMeta(args[2],env);
    args=args[1];
  }
console.log("hint = " + types.pr_obj(hints))
  let ret=nodeTag(tnode(),ast),
      fargs= handleFuncArgs(parseFuncArgs(args),env);
  if (mtdQ) {
    if (hints["static"]) { ret.add("static "); }
    ret.add([fname, " ("]);
  }
  else if (dotQ) {
    ret.add([fname, " = function ("]);
  } else {
    ret.add("function "+ fname+ "(");
  }
  ret.add(fargs[0]);
  ret.add([") {\n",
           fargs[1],
           transpileDo(body,env),
           pad(indent), "}\n"]);
  if (true ) {
    ret.add(fmtSpecOps(fname, hints));
    //ret.add(";");
  }
  if (doc) {
    doc= doc.replace(rdr.REGEX.dquoteHat, "");
    doc=doc.replace(rdr.REGEX.dquoteEnd, "");
    ret.prepend(
      doc.split("\\n").map(function(s) {
        return "//"+ s +  "\n";
      }));
  }
  if (publicQ && !dotQ &&
             (1=== NSPACES.length)) EXTERNS[fname]=fname;
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_func_private(ast,env){
  return sf_func(ast,env,false);
}
SPEC_OPS["defn-"]=sf_func_private;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_func_public(ast,env) {
  return sf_func(ast,env,true);
}
SPEC_OPS["defn"]=sf_func_public;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_try(ast,env) {
  let sz=ast.length,
       t=null,
       f=null,
       c=null,
       ind= pad(indent);
  //look for finally
  f=ast[ast.length-1];
  if (std.array_p(f) &&
      "finally" == f[0]) {
    f= ast.pop();
    sz=ast.length;
  } else {
    f=null;
  }
  //look for catch
  c= null;
  if (sz > 1) c=ast[sz-1];
  if (std.array_p(c) &&
      "catch" == c[0]) {
    if (c.length < 2 ||
        (! types.symbol_p(c[1]))) syntax_E("e0",ast);
    c=ast.pop();
  } else {
    c=null;
  }
  //try needs either a catch or finally or both
  if (f===null && c===null) syntax_E("e0", ast);
  let ret= nodeTag(tnode(),ast);
  ret.add(["(function() {\n"+ind + "try {\n",
           transpileDo(ast.slice(1),env),
           "\n"+ ind +"} "]);
  if (c) {
    t= c[1];
    ret.add(["catch ("+ t+ ") {\n",
             transpileDo(c.slice(2),env),
             ";\n"+ ind+ "}\n"]);
  }

  if (f) {
    ret.add(["finally {\n",
             transpileDo(f.slice(1),env,false),
             ";\n"+ ind + "}\n"]);
  }

  ret.add(ind +"}).call(this)");
  return ret;
}
SPEC_OPS["try"]=sf_try;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_if(ast,env) {
  let ret=nodeTag(tnode(),ast),
    a1=ast[1],
    a2=ast[2],
    a3=ast.length > 3 ? ast[3] : null;

  indent += tabspace;
  ret.add([
      "(",
      eval_QQ(a1,env),
      " ?\n"+ pad(indent),
      eval_QQ(a2,env),
      " :\n"+ pad(indent),
      (eval_QQ(a3,env) || "null"), ")"]);
  indent -= tabspace;
  return ret;
}
SPEC_OPS["if"]=sf_if;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_nth(ast,env) {
  let ret=nodeTag(tnode(),ast);
  transpileAtoms(ast,env);
  ret.add([ast[1], "[", ast[2], "]"]);
  return ret;
}
SPEC_OPS["nth"]=sf_nth;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_get(ast,env) {
  let ret=nodeTag(tnode(),ast);
  transpileAtoms(ast,env);
  ret.add([ast[1], "[", ast[2], "]"]);
  return ret;
}
SPEC_OPS["aget"]=sf_get;
SPEC_OPS["get"]=sf_get;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_str(ast,env) {
  let ret= nodeTag(tnode(),ast),
      args=ast.slice(1);
  transpileAtoms(args,env);
  if (args.length > 1) {
    ret.add(args);
    ret.join(",");
    ret.prepend("[");
    ret.add("].join(\"\")");
  } else if (args.length > 0) {
    ret.add(["", args[0], ".toString()"]);
  }
  return ret;
}
SPEC_OPS["str"]=sf_str;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_array(ast,env) {
  let p= pad(indent),
      epilog= " ]";
  let ret= nodeTag(tnode(),ast);
  if (!ast || ast.length===0) {
    ret.add("[]");
  } else {
    if (!types.vector_p(ast)) {
      ast.splice(0, 1);
    }
    indent += tabspace;
    transpileAtoms(ast,env);
    p= pad(indent);
    ret.add( "[ ");
    for (var i= 0; i< ast.length; ++i) {
      if (i > 0) ret.add(",");
      ret.add(ast[i]);
    }
    ret.add(epilog);
    indent -= tabspace;
  }
  return ret;
}
SPEC_OPS["vec"]= sf_array;
SPEC_OPS["["]= sf_array;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_object(ast,env) {
  let ret= nodeTag(tnode(),ast);
  let p= pad(indent),
      epilog= " }";
  if (!ast || ast.length===0) {
    ret.add("{}");
  } else {
    if (!types.map_p(ast)) {
      ast.splice(0, 1);
    }
    indent += tabspace;
    transpileAtoms(ast,env);
    p= pad(indent);
    ret.add( "{ ");
    for (var i= 0; i< ast.length; i +=2) {
      if (i > 0) ret.add(",");
      ret.add([ast[i],
                 ": ",
                 ast[i+1]]);
    }
    ret.add(epilog);
    indent -= tabspace;
  }
  return ret;
}
SPEC_OPS["hash-map"]= sf_object;
SPEC_OPS["{"]= sf_object;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var includeFile=
  (function() {
    let icache= [];
    return function (fname) {
      if (icache.includes(fname)) { return ""; }
      icache.push(fname);
      let src=fs.readFileSync(fname,"utf-8");
      return transpileTree(
                psr.parser(src, fname),rt.globalEnv());
    };
  })(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_include (expr) {

  let ret=[],fname, dir= path.dirname(expr.source);

  for (var i=1,e=null; i < expr.length; ++i) {
    e= expr[i];
    if (!std.array_p(e) ||
           1 !== e.length) syntax_E("e0",expr);
    fname=e[0];
    if (fname)
      fname= fname.replace(new RegExp("[\"]", "g"), "");
    try {
      fname= fs.realpathSync(dir +  "/" +  fname);
    } catch(e) {
      syntax_E("e11", expr);
    }
    try {
      indent -= tabspace;
      ret.push(includeFile(fname));
    } finally {
      NSPACES.pop();
      indent += tabspace;
    }
  }
  return ret.length > 0 ? ret : "";
}


//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_require(ast,env) {
  let ret= nodeTag(tnode(),ast);
  let refers,renames;
  let path=null,as=gensym(),v= null, e=null;
  for (var i= 1;
       i < ast.length; ++i) {
    e= ast[i];
    if (!std.array_p(e) || e.length < 3) syntax_E("e0",ast);
    path=e[0];
    for (var j=1;j<e.length;++j) {
      v= e[j];
      if (v == "as") {
        as=""+e[j+1];
        ++j;
      } else if (v== "refer") {
        refers=e[j+1]; ++j;
      } else if (v == "rename") {
        renames= e[j+1]; ++j;
      }
    }
    ret.add(["var ",
             rdr.jsid(as),
             "= require(",
             transpileSingle(path), ");\n"]);
    refers= refers || [];
    renames= renames || [];
    for (let i=0; i< refers.length;++i) {
      v=transpileSingle(refers[i]);
      ret.add(["var ", v,"=",as,"[\"",v,"\"];\n"]);
    }
    for (let i=0; i< renames.length; i += 2) {
      e=transpileSingle(renames[i]);
      v=transpileSingle(renames[i+1]);
      ret.add(["var ", v,"=",as,"[\"",e,"\"];\n"]);
    }
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function resolveMeta(ast,env) {
  let r, v={};
  if (Array.isArray(ast)) {
    v=JSON.parse("" + eval_QQ(ast,env));
  } else if (types.keyword_p(ast)) {
    r=[ast, true];
    r.__ismap__=true;
    v=JSON.parse("" + eval_QQ(r,env));
  } else if (types.symbol_p(ast)) {
    r=[types.symbol("tag"), ast];
    r.__ismap__=true;
    v=JSON.parse("" + eval_QQ(r,env));
  } else {
    throw new Error("Bad meta value" + types.pr_obj(ast));
  }
  return v;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_ns(ast,env) {
  let ret= [];
  let hints={};
  let nsp=ast[1];

  if (Array.isArray(nsp) && nsp.length===3 &&
      (nsp[0] == "with-meta") &&
      types.symbol_p(nsp[1])) {
    hints=resolveMeta(nsp[2],env);
    nsp=nsp[1];
  }

  NSPACES.push(types.symbol_s(nsp));
  ast=ast.slice(2);
  for (var i= 0; i < ast.length; ++i) {
    let e= ast[i];
    if (types.list_p(e) &&
             "include"== e[0]) {
      ret.push(sf_include(e));
    }
    else if (types.list_p(e) &&
             "require"==e[0]) {
      ret.push(sf_require(e));
    }
  }
  return ret;
}
SPEC_OPS["ns"]=sf_ns;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_comment(ast,env) {
  return nodeTag(tnode(),ast);
}
SPEC_OPS["comment"]=sf_comment;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_for(ast,env) {
  let ret=nodeTag(tnode(),ast),
      a1=ast[1],
      vars=[], tst, recurs=[],
      body=ast.slice(2);
  for (let i=0,e=null; i<a1.length; ++i) {
    e=a1[i];
    if (e == "while") {
      tst=a1[i+1];
      ++i;
    }  else if (e == "recur") {
      recurs=a1.slice(i+1);
      i=a1.length;
    }  else if (types.symbol_p(e)) {
      vars.push(e,a1[i+1]);
      ++i;
    }
  }
  if (body.length===0) {return "";}
  ret.add("for (");
  for (let i=0; i < vars.length;  i += 2) {
    if (i===0) { ret.add("let ");  }
    else if (i !== 0) { ret.add(","); }
    ret.add([transpileSingle(vars[i]),"=", eval_QQ(vars[i+1],env)]);
  }
  if (vars.length > 0) {
    ret.add(",____break=false");
  } else {
    ret.add("let ____break=false");
  }
  ret.add("; ");

  let nb= [types.symbol("not"), types.symbol("____break")];
  if (tst) {
    tst= [types.symbol("and"), nb, tst];
  } else {
    tst=nb;
  }
  ret.add(eval_QQ(tst,env));
  ret.add("; ");
  for (let i=0,k=0; i < recurs.length; ++i, k+= 2) {
    if (i !== 0) { ret.add(","); }
    ret.add([transpileSingle(vars[k]),"=", eval_QQ(recurs[i],env)]);
  }
  ret.add("){\n");
  ret.add(transpileDo(body,env,false));
  ret.add("}\n");

  ret.prepend("(function() {\n");
  ret.add("})(this);\n");

  return ret;
}
SPEC_OPS["for"]=function (ast,env) {
  return sf_for(ast,env);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_floop(ast,env,hint) {
  let ret= nodeTag(tnodeEx("for ("),ast);
  let c1=null,
      c2=null,
      c3=null,
      c=ast[1],
      ind= pad(indent);

  if ((! std.array_p(c)) ||
      (3 !== c.length)) syntax_E("e0",ast);

  c1=c[0];
  c2=c[1];
  c3=c[2];
  indent += tabspace;

  if (std.array_p(c1)) {
    if (types.keyword_p(c1[0]) && c1[0] == "let") {
      c1=c1.slice(1);
      hint="let ";
    }
    for (var i= 0; i < c1.length; i += 2) {
      if (i === 0) ret.add(hint);
      if (i > 0) ret.add(",");
      ret.add([transpileSingle(c1[i]),
               " = ",
               eval_QQ(c1[i+1],env)]);
    }
  }
  ret.add("; ");
  if (std.array_p(c2)) {
    ret.add(["(!____break && ", transpileList(c2,env), ")"]);
  } else {
    ret.add(["(!____break && ", transpileSingle(c2,env), ")"]);
  }
  ret.add("; ");
  if (std.array_p(c3))
    for (var i= 0; i < c3.length; i += 2) {
      if (i > 0) ret.add(",");
      ret.add([transpileSingle(c3[i]),
               " = ",
               eval_QQ(c3[i+1],env)]);
    }
  ret.add(") {\n");
  if (ast.length > 2) {
    ret.add([ind,
             pad(tabspace),
             transpileDo(ast.slice(2),env,false), ""]);
  }
  ret.add("\n"+ ind+ "}\n");
  ret.prepend("(function () {let ____break=false;\n");
  ret.add("}).call(this)");
  indent -= tabspace;
  return ret;
}
//SPEC_OPS["for"]=function (ast,env) { return sf_floop(ast,env,""); }
//SPEC_OPS["forlet"]=function (ast,env) { return sf_floop(ast,env,"let"); }

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_wloop(ast,env) {
  let ret= nodeTag(tnodeEx("for (;"),ast);
  let cond=ast[1],
      ind= pad(indent);

  ret.add([" (!____break && ", eval_QQ(cond,env), ") "]);
  ret.add(";) {\n");
  indent += tabspace;
  if (ast.length > 2) {
    ret.add([ind,
             pad(tabspace),
             transpileDo(ast.slice(2),env,false), ";"]);
  }
  ret.add("\n"+ ind+ "}\n");
  ret.prepend("(function () {let ____break=false;\n");
  ret.add("}).call(this)");
  indent -= tabspace;
  return ret;
}
SPEC_OPS["xwhile"]=sf_wloop;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_jscode(ast,env) {
  return nodeTag(tnodeEx(
    ast[1].toString().
    replace(rdr.REGEX.dquoteHat,"").
    replace(rdr.REGEX.dquoteEnd,"")),ast);
}
SPEC_OPS["js#"]=sf_jscode;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_macro(ast,env) {
  let doc,args,body;
  if (typeof ast[2] === "string") {
    doc=ast[2];
    args=ast[3];
    body=ast.slice(4);
  } else {
    args=ast[2],
    body=ast.slice(3);
  }

  let pms=types.vector();
  for (let i=0,e=null; i < args.length; ++i) {
    e=args[i];
    if (e == "&") {
      if (Array.isArray(args[i+1])) {
        e=args[i+1];
        ++i;
        for (let j=0,x=null;j<e.length;++j) {
          x=e[j];
          if (! types.symbol_p(x)) {
            throw new Error("Bad optional arg for macro");
          }
          pms.push(x);
        }
      } else {
        pms.push(e, args[i+1]);
        ++i;
      }
    }
    else if (!types.symbol_p(e)) {
      throw new Error("Bad optional arg for macro");
    } else {
      pms.push(e);
    }
  }

  ast=[ast[0], ast[1],
       [types.symbol("fn*"), pms].concat(body)];

  let a2=ast[2];
  let a1=ast[1].toString();
  let func = rt.eval(a2, env);
  func._ismacro_ = true;
  if (doc) {
    func.____doc=doc;
  }
  macros.set(a1,func);
  return nodeTag(tnode(),ast);
}
SPEC_OPS["defmacro"]=sf_macro;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_unary(ast,env) {
  let ret=nodeTag(tnode(),ast),
      a0=ast[0],
      a1=ast[1];

  if (a0 == "not") a0=types.symbol("!");

  ret.add(["(", eval_QQ(a0,env) , eval_QQ(a1,env), ")"]);
  return ret;
}
regoBuiltins(sf_unary, "unary");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_doseq(ast,env) {
  let whileexpr,whenexpr,letexpr;
  let ret=nodeTag(tnode(),ast),
      args= ast[1],
      body= ast.slice(2),
      loopvar= args[0],
      loopexpr= args[1],
      escvar=gensym(),
      idxvar=gensym(),
      exprvar=gensym();

  ret.add(["let ", transpileSingle(loopvar),
           "= ", exprvar, "[",idxvar,"];\n"]);
  if (args.length > 2)
    for (var i=2,v=null; i < args.length; ++i) {
      v=args[i];
      if (v == "while") {
        whileexpr=args[i+1];
        ret.add(["if (! ", eval_QQ(whileexpr,env),
                 ") {", escvar,"=true;}\n"]);
      } else if (v == "when") {
        whenexpr=args[i+1];
        ret.add(["if (!", escvar,") {\n"]);
        ret.add(["if (! ", eval_QQ(whenexpr,env),") {continue;}\n"]);
        ret.add("}\n");
      } else if (v == "let") {
        letexpr=[types.symbol("var")].concat(args[i+1]);
        ret.add(sf_var_let(letexpr,env));
      }
    }
  ret.add(["if (!", escvar,") {\n"])
  ret.add(transpileDo(body,env,false));
  ret.add("}\n");
  ret.add("}\n");
  ret.prepend(["for(var ", escvar,"=false,", idxvar,"=0; ",
               "(!", escvar," && ", idxvar," < ", exprvar, ".length); ++", idxvar,") {\n"]);
  ret.prepend(["let ",exprvar,"= ", eval_QQ(loopexpr,env), ";\n"]);
  ret.prepend("(function() {\n");
  ret.add("})(this);\n");
  return ret;
}
SPEC_OPS["doseq"]=sf_doseq;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function spitExterns() {
  let ks= Object.keys(EXTERNS),
      p= pad(tabspace),
      s="";

  if (ks.length > 0) {
    s= ks.map(function(k) {
              return p + k + ": " + k;
       }).join(",\n");
    s= "\n\nmodule.exports = {\n" +  s +  "\n};\n\n";
  }

  return s;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function banner() {
  return "/*" +
       "Auto generated by Kirby - v" +
       MODULE_VERSION +
       " " +
       NSPACES[0] + " " +
       (new Date) +
       "*/\n\n";
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileCode(codeStr, fname, srcMap_Q) {

  indent= -tabspace;
  EXTERNS= {};
  NSPACES = [];

  let options={};
  let outNode= transpileTree(
                psr.parser(codeStr, fname),rt.globalEnv()),
      cstr,
      extra= spitExterns();
  outNode.prepend(banner());

  if (srcMap_Q) {
    let outFile= path.basename(fname, ".ky") + ".js",
        srcMap= outFile+ ".map",
        output= outNode.toStringWithSourceMap(
                                         {file: outFile });
    fs.writeFileSync(srcMap, output.map);
    cstr= output.code + extra +
           "\n//# sourceMappingURL=" +
           path.relative(path.dirname(fname), srcMap);
  } else {
    cstr= outNode + extra;
  }
  cstr=cleanCode(cstr);
  if (false) {
    cstr= esfmt.format(cstr, options);
  }
  return cstr;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function cleanCode(code) {

  return code.split("\n").map(function(s) {
    s=s.trim();
    return (s === ";") ? "" : s;
  }).join("\n");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileXXX(code, file, smap_Q) {
  try {
    return transpileCode(code, file, smap_Q);
  } catch (e) {
    console.log(e.stack);
    throw e;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpileWithSrcMap(code, file) {
  return transpileXXX(code, file, true);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function transpile(code, file) {
  return transpileXXX(code, file, false);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function parseWithSourceMap(codeStr, fname) {
  let outNode= transpileTree(psr.parser(codeStr, fname));
  outNode.prepend(banner());
  return outNode.toStringWithSourceMap();
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var version= MODULE_VERSION;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports = {
  transpileWithSrcMap: transpileWithSrcMap,
  transpile: transpile,
  parseWithSourceMap: parseWithSourceMap,
  version: version
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF
function destruct1(lhs) {
  let as="", keys={};
  if (types.vector_p(lhs)) {
    for(var i=0,e=null;i<lhs.length;++i) {
      e=lhs[i];
      if(types.symbol_p(e)) {
        if (e == "_") {}
        else if (e == "&") {
          keys["&"+lhs[i+1]]=i;
          ++i;
        }
        else if (e.toString().startsWith("&")) {
          keys[""+e]=i;
        }
        else {
          keys[""+e]=i;
        }
      } else if (types.keyword_p(e)) {
        if (e == "as") {
          ++i;
          as=lhs[i].toString();
        } else {
          throw new Error("bad keyword: " + e);
        }
      }
    }
  } else if (types.map_p(lhs)) {
    for(var i=0,e=null;i < lhs.length;++i) {
      e=lhs[i];
      if (types.keyword_p(e)) {
        if (e == "keys" || e == "strs") {
          let ks=lhs[i+1];
          ++i;
          for (var j=0;j < ks.length; ++j) {
            keys[""+ks[j]]=null;
          }
        } else if (e == "as") {
          ++i;
          as=lhs[i].toString();
        }
      } else {
        throw new Error("bad destruct field: " + types.obj_type(e));
      }
    }
  } else if (types.symbol_p(lhs)) {
    keys[""+lhs]=null;
  } else {
    throw new Error("cant destruct with: " + types.obj_type(lhs));
  }

  return [as, keys];
}

function destruct0(cmd, lhs,rhs,env) {
  let d= destruct1(lhs),
      as=d[0],
      keys=d[1];
  if (as && as.length >0) {} else { as=gensym(); }
  as=rdr.jsid(as);
  let kdefs=[], ka,kvals=tnode();
  Object.entries(keys).forEach(function(x) {
    let n,name= x[0]; let rest=false;
    if (name.startsWith("&")) {
      rest=true;
      name=name.slice(1);
    }
    n= rdr.jsid(name);
    kdefs.push(n);
    let pos=x[1];
    if (pos===null) {
      ka=n + "=" + as + "[\"" + name + "\"];\n";
    } else if (rest) {
      ka= n + "=" + as + ".slice(" + pos + ");\n";
    } else {
      ka= n + "=" + as + "[" + pos + "];\n";
    }
    kvals.add(ka);
  });
  kvals.prepend(cmd + " " + kdefs.join(",") + ";\n");

  return [[tnodeEx([cmd, " ",
                   rdr.jsid(as), "= ",
                   eval_QQ(rhs,env),";\n"]), kvals],
          kdefs];
}

