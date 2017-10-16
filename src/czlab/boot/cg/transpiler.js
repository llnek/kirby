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
    fs=require("fs"),
    psr=require("../bl/parser"),
    rt=require("../rt/runtime");

var tnodeEx=tn.tnodeEx;
var tnode=tn.tnode;
var gensym_counter=1;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function gensym() {
  let x= gensym_counter;
  gensym_counter++;
  return "G____" + x;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function destruct_vec(cmd, lhs,rhs) {
  let ret=tnode(),
    v,
      r=gensym();
  ret.add([cmd, " ", r, "= ", rhs, ";\n"]);
  for (var i=0; i < lhs.length; ++i) {
    v=transpileSingle(lhs[i]);
    if (v == "_") {}
    else {
      ret.add([cmd, " ", v, "= ", r, "[", ""+i, "];\n"]);
    }
  }
  return ret;
}

function destruct_map(cmd, lhs,rhs) {
  let ret=tnode(),
      keys=[],
      k,v,
      r=gensym();
  ret.add([cmd, " ", r, "= ", rhs, ";\n"]);
  for (var i=0; i < lhs.length; ++i) {
    //look for :strs
    if ("keys" == lhs[i]) {
      keys=lhs[i+1];
      break;
    }
  }
  for (var i =0; i < keys.length; ++i) {
    k= transpileSingle(keys[i]);
    ret.add([cmd, " ", k, "= ", r, "[\"", k, "\"];\n"]);
  }
  return ret;
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
"arith": ["+","-","*","/","%", "mod"],
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
  "aset", "set!", "fn", "def!",
  "defn-", "defn",
  "try", "if", "get", "aget", "str",
  "list", "[", "vec", "{", "hash-map",
  "ns", "comment", "for", "cons",
  "js#", "macro", "defmacro"]};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var MODULE_VERSION= "1.0.0",
    nosemi_Q= false,
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
      ret.add([pstr,
               tmp,
               nosemi_Q ? "" : ";", "\n"]);
      nosemi_Q=false;
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
function transpileList(ast, env) {
  let cmd= "",
      mc= null,
      tmp= null;
  cmd=findCmd(ast);
  mc= macros.get(cmd);

  let ret=tnode();
  if (mc) {
    ast=rt.expandMacro(ast, env, mc);
    cmd= findCmd(ast);
  }

  if (cmd.startsWith(".-")) {
    let c= transpileSingle(types.symbol(cmd.slice(2)));
    ret.add([eval_QQ(ast[1],env), ".",c]);
    //ret.add(["[\"", c "\"]"]);
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

  if(cmd == "mod") cmd="%";

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
        ret.add(["case ", e[j], ":\n"]);
        if (j === (e.length-1))
          ret.add(["____x= ",
                   eval_QQ(c,env), ";\nbreak;\n"]);
      }
    } else {
      ret.add(["case ", e, ":\n"]);
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

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_varXX (ast, env, cmd) {
  //must be even pairs
  if (ast.length < 3 ||
      0 === (ast.length % 2)) syntax_E("e0", ast);

  let vname=null, publicQ= ("global" == cmd);
  let ret=nodeTag(tnode(),ast);

  if (ast.length > 3) indent += tabspace;

  if (publicQ ||
          ("local" == cmd)) cmd="var";

  transpileAtoms(ast,env);
  for (var i= 1; i< ast.length; i += 2) {
    if (i > 1)
      ret.add(",\n" +  pad(indent));
    if (!rdr.testid_Q( ast[i])) syntax_E("e9",ast);
    vname= types.symbol_s(ast[i]);
    if (publicQ &&
        (1 === NSPACES.length)) EXTERNS[vname]= vname;
    ret.add([vname, " = ", ast[i+1]]);
  }
  ret.prepend(" ");
  ret.prepend(cmd);
  if (ast.length > 3) indent -= tabspace;
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_var (ast, env, cmd) {
  let vname=null, publicQ= ("global" == cmd);
  let ret=nodeTag(tnode(),ast);

  ast=ast.slice(1);
  if (publicQ ||
          ("local" == cmd)) cmd="var";

  let keys= std.evens(ast);
  let vals= std.odds(ast);
  let k,v;

  for (var i= 0; i< keys.length; ++i) {
    k=keys[i];
    v=eval_QQ(vals[i],env);

    if (types.vector_p(k)) {
      ret.add(destruct_vec(cmd, k, v));
    }
    else if (types.map_p(k)) {
      ret.add(destruct_map(cmd, k, v));
    }
    else if (types.symbol(k)) {
      ret.add([cmd, " ", types.symbol_s(k), " = ", v, ";\n"]);
    }
    //if (publicQ && (1 === NSPACES.length)) EXTERNS[vname]= vname;
  }
  //ret.prepend(" ");
  //ret.prepend(cmd);
  //if (ast.length > 3) indent -= tabspace;
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_var_local(ast,env) {
  return sf_var(ast, env, "local");
}
SPEC_OPS["def-"]=sf_var_local;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_var_global(ast,env) {
  return sf_var(ast,env, "global");
}
SPEC_OPS["def"]=sf_var_global;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_var_let (ast,env) {
  return sf_var(ast,env, "let");
}
SPEC_OPS["var"]=sf_var_let;

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
  ret.add(["delete ", eval_QQ(ast[1])]);
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
function sf_set(ast,env) {
  let ret= nodeTag(tnode(),ast),
      e1= eval_QQ(ast[1],env);

  if (4 === ast.length) {
    ret.add(e1);
    ret.add("[");
    ret.add(eval_QQ(ast[2],env));
    ret.add("]");
  } else {
    ret.add(e1);
  }
  ret.add([" = ", eval_QQ(ast[ast.length-1],env)]);
  return ret;
}
SPEC_OPS["aset"]=sf_set;
SPEC_OPS["set!"]=sf_set;
SPEC_OPS["def!"]=sf_set;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_lambda(ast,env) {
  let args=ast[1],
    varg="",
      body= ast.slice(2),
      ret= null;

  args= args.map(function(a) { return a;});
  transpileAtoms(args,env);
  args=handleArgs(args);
  if (args[1] >= 0) {
    //var-args
    varg="let " + args[2] + "=Array.prototype.slice.call(arguments," +
      args[1] + ");\n";
  }
  ret= nodeTag(tnodeEx(args[0]),ast);
  ret.join(",");
  ret.prepend("function (");
  ret.add([") {\n", varg,
           transpileDo(body,env),
           pad(indent), "}"]);
  return ret;
}
SPEC_OPS["fn"]=sf_lambda;

function handleArgs(args) {
  let skip=-1, varg="", ret=[];
  for (var i=0,e=null; i < args.length; ++i) {
    e= args[i];
    if (e== "&") {
      varg = "" + args[i+1];
      skip=i;
      break;
    }
    if ((""+e).startsWith("&")) {
      varg= ("" + e).slice(1);
      skip=i;
      break;
    }
    ret.push(e);
  }
  return [ret,skip,varg];
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_func(ast,env,publicQ) {
  let fname= transpileSingle(ast[1]),
      dotQ= fname.includes("."),
      e3= ast[3],
      e2= ast[2],
      doc=null, attrs=null, args= 2, body= 3;
  if (types.list_p(e2)) {}
  else if (std.string_p(e2)) {
    doc= 2;
    args= 3;
    if (types.map_p(e3)) {
      attrs= 3;
      args= 4;
    }
  } else if (types.map_p(e2)) {
    attrs= 2;
    args= 3;
  }
  body= args+1;
  if (doc) doc= ast[doc];
  if (attrs) attrs= ast[attrs];
  args= ast[args];
  args= args.map(function(a) { return a;});
  transpileAtoms(args,env);
  args= handleArgs(args);
  body= ast.slice(body);
  let ret=nodeTag(tnodeEx(args[0]),ast);
  let vargs="";
  ret.join(",");
  if (dotQ) {
    ret.prepend([fname, " = function ("]);
  } else {
    ret.prepend("function "+ fname+ "(");
  }
  if (args[1] >= 0) {
    //var-args
    vargs="let " + args[2] + "=Array.prototype.slice.call(arguments," +
      args[1] + ");\n";
  }
  ret.add([") {\n",
           vargs,
           transpileDo(body,env),
           pad(indent), "}\n"]);
  if (false && attrs) {
    //ret.add(fmtSpecOps(fname, attrs));
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
  nosemi_Q=true;
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
             transpileDo(f.slice(1),env),
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
    ret.add(args[0].toString());
  }
  return ret;
}
SPEC_OPS["str"]=sf_str;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_array(ast,env) {
  let p= pad(indent),
      epilog= "\n"+ p+ "]";
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
    ret.add( "[\n"+ p);
    for (var i= 0; i< ast.length; ++i) {
      if (i > 0) ret.add(",\n"+ p);
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
      epilog= "\n"+ p +"}";
  if (!ast || ast.length===0) {
    ret.add("{}");
  } else {
    if (!types.map_p(ast)) {
      ast.splice(0, 1);
    }
    indent += tabspace;
    transpileAtoms(ast,env);
    p= pad(indent);
    ret.add( "{\n"+ p);
    for (var i= 0; i< ast.length; i +=2) {
      if (i > 0) ret.add(",\n"+ p);
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
  let path=null,v= null, e=null;
  for (var i= 1;
       i < ast.length; ++i) {
    e= ast[i];
    if (!std.array_p(e) ||
           3 !== e.length) syntax_E("e0",ast);
    path=e[0];
    v= e[2];
    ret.add(["var ",
             transpileSingle(v),
             "= require(",
             transpileSingle(path), ");\n"]);
  }
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_ns(ast,env) {
  let nsp, ret= [];
  //look for symbol or with-meta, symbol for namespace
  for (var i= 1; i < ast.length; ++i) {
    let e= ast[i];
    if (types.symbol_p(e)) {
      if (nsp) syntax_E("e0",ast);
      NSPACES.push(nsp=e.toString());
    }
    else
    if (types.list_p(e) &&
        e[0] == "with-meta" &&
        types.symbol_p(e[1])) {
      if (nsp) syntax_E("e0",ast);
      NSPACES.push(nsp=e[1].toString());
    }
    else if (types.list_p(e) &&
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

  if (std.array_p(c1))
    for (var i= 0; i < c1.length; i += 2) {
      if (i === 0) ret.add(hint+" ");
      if (i > 0) ret.add(",");
      ret.add([transpileSingle(c1[i]),
               " = ",
               eval_QQ(c1[i+1],env)]);
    }
  ret.add("; ");
  if (std.array_p(c2))
    ret.add(transpileList(c2,env));
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
             transpileDo(ast.slice(2),env,false), ";"]);
  }
  ret.add("\n"+ ind+ "}\n");
  ret.prepend("(function () {\n");
  ret.add("}).call(this)");
  indent -= tabspace;
  return ret;
}
SPEC_OPS["for"]=function (ast,env) {
  return sf_floop(ast,env,"");
}
SPEC_OPS["forlet"]=function (ast,env) {
  return sf_floop(ast,env,"var");
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_wloop(ast,env) {
  let ret= nodeTag(tnodeEx("for (;"),ast);
  let cond=ast[1],
      ind= pad(indent);

  ret.add(eval_QQ(cond,env));
  ret.add(";) {\n");
  indent += tabspace;
  if (ast.length > 2) {
    ret.add([ind,
             pad(tabspace),
             transpileDo(ast.slice(2),env,false), ";"]);
  }
  ret.add("\n"+ ind+ "}\n");
  ret.prepend("(function () {\n");
  ret.add("}).call(this)");
  indent -= tabspace;
  return ret;
}
SPEC_OPS["while"]=sf_wloop;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_jscode(ast,env) {
  nosemi_Q= true;
  return nodeTag(tnodeEx(
    ast[1].toString().
    replace(rdr.REGEX.dquoteHat,"").
    replace(rdr.REGEX.dquoteEnd,"")),ast);
}
SPEC_OPS["js#"]=sf_jscode;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function sf_macro(ast,env) {
  let p2=ast[2],
      p3=ast.slice(3);
  ast=[ast[0], ast[1],
       [types.symbol("fn*"), p2].concat(p3)];

  let a2=ast[2];
  let a1=ast[1].toString();
  let func = rt.eval(a2, env);
  func._ismacro_ = true;
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

  let outNode= transpileTree(
                psr.parser(codeStr, fname),rt.globalEnv()),
      extra= spitExterns();
  outNode.prepend(banner());

  if (srcMap_Q) {
    let outFile= path.basename(fname, ".ky") + ".js",
        srcMap= outFile+ ".map",
        output= outNode.toStringWithSourceMap(
                                         {file: outFile });
    fs.writeFileSync(srcMap, output.map);
    return output.code +
           extra +
           "\n//# sourceMappingURL=" +
           path.relative(path.dirname(fname), srcMap);
  } else {
    return outNode + extra;
  }
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
