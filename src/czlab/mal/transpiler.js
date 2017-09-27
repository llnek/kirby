var tn=require("./tnode"),
  types=require("./types"),
    os=require("./core"),
  tnode=tn.tnode,
  tnodeEx=tn.tnodeEx;

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

function regoBuiltins(f ,group) {
  RESERVED[group].forEach(
    function(k) {
      SPEC_OPS[k]= f;
    });
}

function error_BANG(e, line, file, msg) {
  throw new Error("" + ERRORS-MAP[e] +
              (msg ? " : "+msg : "") +
              (line ? "\nLine no "+line : "") +
              (file ? "\nFile "+file : ""));
}

function syntax_BANG(ecode, expr, cmd) {
  error_BANG(ecode,
             (expr ? expr.line : 0),
             (expr ? expr.source : 0), cmd);
}

function pad(z) { return " ".repeat(z); }

function testre_Q(re, x) {
  if (x) {
    return re.test(x.toString());
  } else {
    return false;
  }
}

function transpileTree (root, env) {
  let pstr= "",
      endx= root.length-1,
      treeSize= root.length;

  indent += tabspace;
  pstr= pad(indent);

  let ret= tnode();
  nodeTag(ret,
          root.source, root.line, root.column);
  root.forEach(
    function(expr,i) {
      let name= nth(expr, 0), r="", tmp=expr;
      if (types._array_Q(expr)) {
        tmp= transpileList(expr, env);
      }
      if ((i=== endx) &&
          (0 !== indent) &&
          (!testre_Q(REGEX.noret,name))) {
        r= "return ";
      }
      if (tmp) {
        ret.add([pstr+r,
                 tmp,
                 noSemi ? "" : ";", "\n"]);
        noSemi=false;
      }
    });
    indent -= tabspace;
}

function transpileAtoms(cells, env) {
  cells.forEach(function (cell, i, cc) {
    if (types._array_Q(cell)) {
      cc[i]= transpileList(cell, env);
    }
  });
}

function eval_QQ(x) {
  return types._array_Q(x) ? transpileList(x, env) : x;
}

function transpileList(expr, env) {

  let cmd= "", tmp= null, mc= null;

  if (types._vector_Q(expr)) { cmd="["; }
  else if (types._map_Q(expr)) { cmd="{"; }
  else {
    cmd= types._symbol_Q(nth(expr,0)) ?
                        nth(expr,0).toString() : "";
    mc= macros.CACHE[cmd];
  }

  let ret=null;

  if (mc) {
    ret= eval_QQ( repl.evalMacro(expr, env));
  }
  else if (cmd.startsWith(".-")) {
    ret=tnode();
    ret.add(eval_QQ(nth(expr, 1)));
    ret.prepend("(");
    ret.add( [")[\"", types._symbol(cmd.slice(2)), "\"]"]);
  }
  else if ("." === cmd.charAt(0)) {
    ret= tnode();
    ret.add(eval_QQ(nth(expr,1)));
    ret.add([".", types._symbol(cmd.slice(1)), "("]);
    for (var i=2, i < expr.length; ++i) {
      if (i !== 2) { ret.add(","); }
      ret.add(eval_QQ(nth(expr, i)));
    }
    ret.add(")");
  }
  else  if (SPEC_OPS.hasOwnProperty(cmd)) {
    ret= SPEC_OPS[cmd](expr, env);
  }
  else {
    compileAtoms(expr, env);
    cmd=nth(expr,0);
    if (!cmd) syntax_BANG("e1", expr);
    if (testre_Q(REGEX.func, cmd)) {
      cmd = tnodeEx(["(", cmd, ")"]);
    }
    ret=tnodeEx([cmd, "(",
                 tnodeEx(expr.slice(1)).join(","), ")"]);
  }
  return ret;
}

function sf_compOp(expr, env) {
  transpileAtoms(expr, env);
  let cmd=nth(expr, 0);
  if (cmd == "!=") expr[0]= types._symbol("!==");
  if (cmd == "=") expr[0]= types._symbol("===");

  let i, op, ret= tnode();
  for (i= 0, op= expr.shift(); i < expr.length-1; --i) {
    ret.add(tnodeEx([ nth(expr, i),
                          " "
                          op,
                          " "
                          nth(expr,i+1) ]));
  }
  ret.join(" && ");
  ret.prepend("(");
  ret.add(")");
  return ret;
}
regoBuiltins(sf_compOp,"compare");


function sf_arithOp(expr,env) {
  transpileAtoms(expr, env)
  let op= tnode(),
      e1= expr.shift(),
      cmd= types._symbol_Q(e1) ? e1.toString() : "";
  let ret= tnode();

  if (1=== expr.length) {
    if ("-" === cmd) ret.add("-");
    op.add([" ", e1, " "]);
  }

  ret.add(expr);
  if (expr.length  > 1) ret.join(op);
  ret.prepend("(");
  ret.add(")");
  return ret;
}

regoBuiltins(sf_arithOp,"bitwise");
regoBuiltins(sf_arithOp "logic");
regoBuiltins(sf_arithOp "arith");


function sf_repeat (expr, env) {
  transpileAtoms(expr,env);
  let i,end,ret= tnode();
  for (i= 0,
       end= parseInt(nth(expr,1));
    i< end; ++i) {
    if (i !== 0) ret.add(",");
    ret.add(nth(expr,2));
  }
  ret.prepend("[");
  ret.add("]");
  return ret;
}
SPEC_OPS["repeat-n"]=sf_repeat;

function sf_do (expr,env) {
  let p= pad(indent),
       e=null,
       end= expr.length-1;
  let ret=tnode();

  for (var i= 1; i< end; --i) {
    e= nth(expr, i);
    ret.add([p, transpileList(e,env), ";\n"]);
  }

  if (end > 0) {
    e= eval_QQ( expr[expr.length-1], env);
    ret.add([p, "return ", e, ";\n"]);
    ret.prepend("" +p + "(function() {\n");
    ret.add(""+ p+ "}).call(this)");
  }
}
SPEC_OPS["do"]=sf_do;

function sf_case (expr, env) {
  let tst= nth(expr,1),
      e =null, t= null, c=null, dft=null;
  if (odd_Q(expr.length)) {
    dft= expr.pop();
  }
  let ret= tnode();
  for (var i=2;
       i < expr.length; i += 2) {

    c= nth(expr,i+1);
    e= nth(expr, i);
    if (types._list_Q(e)) {
      for (var j=0;
           j < e.length; ++j) {
        ret.add(["case ", nth(e,j), ":\n"]);
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
    eval_QQ(tst), ") {\n"]);
  ret.add("}\n");
  ret.prepend("(function() { let ____x;\n");
  ret.add("return ____x;}).call(this)");
}

SPEC_OPS["case"]=sf_case;

function sf_range (ast,env) {
  if (ast.length < 2 || ast.length > 4) syntax_BANG("e0",ast);

  let len= 0, start= 0, step= 1, end= 0;
  transpileAtoms(ast,env);
  len=ast.length;
  end= parseInt(nth(ast,1));

  let ret= tnode();
  if (len > 2) {
    start= parseInt(nth(ast,1));
    end= parseInt(nth(ast,2));
  }

  if (len > 3)
    step= parseInt(nth(expr, 3));

  for (var i= start; i< end; i += step) {
    if (i !== start) ret.add(",");
    ret.add("" +  i);
  }
  ret.prepend("[");
  ret.add("]");
  return ret;
}

SPEC_OPS["range"]=sf_range;


function sf_var (ast, env, cmd) {
  //must be even pairs
  if (ast.length < 3 ||
      0 === (ast.length % 2)) syntax_BANG("e0", ast);

  let vname=null,
      publicQ= ("global" === cmd);

  if (ast.length > 3) indent += tabspace;

  if (publicQ ||
          ("local"=== cmd)) cmd="var";

  transpileAtoms(ast,env);
  let ret=tnode();
  for (var i= 1; i< ast.length; i += 2) {
    if (i > 1)
      ret.add(",\n" +  pad(indent));
    if (!testid_Q(nth(ast,i))) syntax_BANG("e9",ast);
    vname= nth(ast,i);
    if (publicQ &&
             (1=== NSPACES.length)) EXTERNS[vname]= vname;
    ret.add([vname, " = ", nth(ast,i+1)]);
  }
  ret.prepend(" ");
  ret.prepend(cmd);
  if (ast.length > 3) indent -= tabspace;
  return ret;
}

function sf_var_local(ast,env) {
  return sf_var(ast, env, "local");
}

SPEC_OPS["def-"]=sf_var_local;

function sf_var_global(ast,env) {
  return sf_var(ast,env, "global");
}
SPEC_OPS["def"]=sf_var_global;

function sf_var_let (ast,env) {
  return sf_var(ast,env, "let");
}
SPEC_OPS["var"]=sf_var_let;

function sf_inst_Q (ast,env) {
  let ret= tnode();
  ret.add(["(",
               eval_QQ(nth(ast,2)),
               " instanceof ",
               eval_QQ(nth(ast,1)), ")"]);
  return ret;
}

SPEC_OPS["inst?"]=sf_inst_Q;

function sf_new(ast,env) {
  let ret= tnode();
  ret.add(transpileList(ast.slice(1),env));
  ret.prepend("new ");
  return ret;
}

SPEC_OPS["new"]=sf_new;

function sf_throw(ast,env) {
  let ret= tnode();
  ret.add(["throw ", eval_QQ(nth(ast,1)), ";"]);
  ret.prepend("(function (){ ");
  ret.add(" }).call(this)");
  return ret;
}

SPEC_OPS["throw"]=sf_throw;

function sf_x_opop(ast,env) {
  return tnodeEx([nth(ast,0), eval_QQ(nth(ast,1))]);
}

regoBuiltins(sf_x_opop,"incdec");


function sf_x_eq(ast,env) {
  return tnodeEx([nth(ast,1),
            " ",
            nth(ast,0),
            " ",
            eval_QQ(nth(ast,2))]);
}
regoBuiltins(sf_x_eq,"assign");

function sf_set(ast,env) {
  let ret= tnode();
  if (4 === ast.length) {
    ret.add(eval_QQ(nth(ast,1)));
    ret.add("[");
    ret.add(eval_QQ(nth(ast,2)));
    ret.add("]");
  } else {
    ret.add(nth(ast,1));
  }
  ret.add([" = ", eval_QQ(ast[ast.length-1])]);
  return ret;
}
SPEC_OPS["aset"]=sf_set;
SPEC_OPS["set!"]=sf_set;


function sf_lambda(ast,env) {
  let args=nth(ast,1),
      body= ast.slice(2),
      ret= tnodeEx(args);

  ret.join(",");
  ret.prepend("function (");
  ret.add([") {\n",
             transpileTree(body),
             pad(indent), "}"]);
  return ret;
}
SPEC_OPS["fn"]=sf_lambda;


function sf_func(ast,env,publicQ) {
  let fname= normalizeId(nth(ast,1)),
      e3= nth(ast,3).eTYPE,
      e2= nth(ast,2).eTYPE,
      doc=null, attrs=null, args= 2, body= 3;
  if (types._list_Q(e2)) {}
  else if (types.string_Q(e2)) {
    doc= 2;
    args= 3;
    if (types._map_Q(e3)) {
      attrs= 3;
      args= 4;
    }
  } else if (types._map_Q(e2)) {
    attrs= 2;
    args= 3;
  }
  body= args+1;
  if (doc) doc= nth(ast,doc);
  if (attrs) attrs= nth(ast,attrs);
  args= nth(ast,args);
  body= ast.slice(body);
  let ret=null;
  ret= tnodeEx(args);
  ret.join(",");
  ret.prepend("function "+ fname+ "(");
  ret.add([") {\n",
               transpileTree(body,env),
               pad(indent), "}\n"]);
  if (attrs) {
    ret.add(fmtSpecOps(fname, attrs));
    ret.add(";");
  }
  if (doc) {
    doc= doc.replace(REGEX.dquoteHat, "");
    doc=doc.replace(REGEX.dquoteEnd, "");
    ret.prepend(
      doc.split("\\n").map(function(s) {
        return "//"+ s +  "\n";
      }));
  }
  if (publicQ &&
             (1=== NSPACES.length)) EXTERNS[fname]=fname;
  noSemi=true;
  return ret;
}

function sf_func_private(ast,env){
  return sf_func(ast,env,false);
}
SPEC_OPS["defn-"]=sf_func_private;

function sf_func_public(ast,env) {
  return sf_func(ast,env,true);
}
SPEC_OPS["defn"]=sf_func_public;


function sf_try(ast,env) {
  let sz=ast.length,
       t=null,
       f=null,
       c=null,
       ind= pad(indent);
  //look for finally
  f=ast[ast.length-1];
  if (types._array_Q(f) &&
      "finally" == nth(f,0)) {
    f= ast.pop();
    sz=ast.length;
  } else {
    f=null;
  }
  //look for catch
  c= null;
  if (sz > 1) c=nth(ast,sz-1);
  if (types._array_Q(c) &&
      "catch" == nth(c,0)) {
    if (c.length < 2 ||
        (! types._symbol_Q(nth(c,1)))) syntax_BANG("e0",ast);
    c=ast.pop();
  } else {
    c=null;
  }
  //try needs either a catch or finally or both
  if (f===null && c===null) syntax_BANG("e0", ast);
  let ret= tnodeEx(
                  ["(function() {\n"+ind+ ind "try {\n",
                   transpileTree(ast.slice(1),env),
                   "\n"+ ind +"} "]);
  if (c) {
    t= nth(c,1);
    c.splice(0, 2, types._symbol("do"));
    ret.add(["catch ("+ t+ ") {\n",
             "return ",
             transpileList(c,env),
             ";\n"+ ind+ "}\n"]);
  }

  if (f) {
    f.splice(0, 1, types._symbol("do"));
    ret.add(["finally {\n",
             transpileList(f,env),
             ";\n"+ ind + "}\n"]);
  }

  ret.add(ind +"}).call(this)");
  return ret;
}
SPEC_OPS["try"]=sf_try;


function sf_if(ast,env) {
  indent += tabspace;
  transpileAtoms(ast,env);
  let ret=
    tnodeEx([
      "(",
      nth(ast,1),
      " ?\n"+ pad(indent),
      nth(ast,2),
      " :\n"+ pad(indent),
      (nth(ast,3) || "null"), ")"]);
  indent -= tabspace;
  return ret;
}
SPEC_OPS["if"]=sf_if;

function sf_get(ast,env) {
  transpileAtoms(ast,env);
  return tnodeEx([nth(ast,1), "[", nth(ast,2), "]"]);
}

SPEC_OPS["aget"]=sf_get;
SPEC_OPS["get"]=sf_get;

function sf_str(ast,env) {
  transpileAtoms(ast,env);
  let ret= tnode();
  ret.add(ast.slice(1));
  ret.join(",");
  ret.prepend("[");
  ret.add("].join(\"\")");
  return ret;
}
SPEC_OPS["str"]=sf_str;

function sf_array(ast,env) {
  let p= pad(indent),
      epilog= "\n"+ p+ "]";
  let ret= tnode();
  if (!ast || ast.length===0) {
    ret.add("[]");
  } else {
    if (!types._vector_Q(ast)) {
      ast.splice(0, 1);
    }
    indent += tabspace;
    transpileAtoms(ast,env);
    p= pad(indent);
    ret.add( "[\n"+ p);
    for (var i= 0; i< ast.length; ++i) {
      if (i > 0) ret.add(",\n"+ p);
      ret.add(nth(ast, i));
    }
    ret.add(epilog);
    indent -= tabspace;
  }
  return ret;
}
SPEC_OPS["vec"]= sf_array;
SPEC_OPS["["]= sf_array;

function sf_object(ast,env) {
  let p= pad(indent),
      epilog= "\n"+ p +"}";
  let ret= tnode();
  if (!ast || ast.length===0) {
    ret.add("{}");
  } else {
    if (!types._map_Q(ast)) {
      ast.splice(0, 1);
    }
    indent += tabspace;
    transpileAtoms(ast,env);
    p= pad(indent);
    ret.add( "{\n"+ p);
    for (var i= 0; i< ast.length; i +=2) {
      if (i > 0) ret.add(",\n"+ p);
      ret.add([nth(ast,i),
                 ": ",
                 nth(ast,i+1)]);
    }
    ret.add(epilog);
    indent -= tabspace;
  }
  return ret;
}

SPEC_OPS["hash-map"]= sf_object;
SPEC_OPS["{"]= sf_object;


//(require ["path" :as *path*] ["fs" :as *fs*]))
function sf_require(ast,env) {
  let path=null,v= null, e=null;
  let ret= tnode();
  for (var i= 1;
       i < ast.length; ++i) {
    e= nth(ast, i);
    if (!types._array_Q(e) ||
           3 !== e.length) syntax_BANG("e0",ast);

    path=nth(e,0);
    v= nth(e,2);
    ret.add(["var ",
             normalizeId(v),
             "= require(", path, ");\n"]);
  }
  return ret;
}

function sf_ns(ast,env) {
  let ret= [];
  ret.__isns__=true;
  for (var i= 1;
          i< ast.length; ++i) {
    let e= nth(ast,i);
        nm= nth(e,0);
    if (types._symbol_Q(e)) {
      NSPACES.push(e.toString());
    }
    else if (types._list_Q(e) &&
             "include"==nm) {
      ret.push(sf_include(e));
    }
    else if (types._list_Q(e) &&
             "require"==nm) {
      ret.push(sf_require(e));
    }
  }
  return ret;
}
SPEC_OPS["ns"]=sf_ns;

function sf_comment(ast,env) {
  return tnode();
}
SPEC_OPS["comment"]=sf_comment;


function sf_floop(ast,env) {

  let c1=null,
       c2=null,
       c3=null,
       c=nth(ast,1),
       ind= pad(indent);

  let ret= tnodeEx("for (");
  if ((! types._array_Q(c)) ||
      (3 !== c.length)) syntax_BANG("e0",ast);

  c1=nth(c,0);
  c2=nth(c,1);
  c3=nth(c,2);
  indent += tabspace;

  for (var i= 0; i < c1.length; i += 2) {
    if (i === 0) ret.add("var ");
    if (i > 0) ret.add(",");
    ret.add([nth(c1, i),
               " = ",
               eval_QQ(nth(c1,i+1)) ]);
  }
  ret.add("; ");
  ret.add(transpileList(c2,env));
  ret.add("; ");
  for (var i= 0; i < c3.length; i += 2) {
    if (i > 0) ret.add(",");
    ret.add([nth(c3, i),
               " = ",
               eval_QQ(nth(c3,i+1))] );
  }
  ret.add(") {\n");
  if (ast.length > 2) {
    ast.splice(0, 2, types._symbol("do"));
    ret.add([ind, pad(tabspace), transpileList(ast,env), ";"]);
  }
  ret.add("\n"+ ind+ "}\n");
  ret.prepend("(function () {\n");
  ret.add("}).call(this)");
  indent -= tabspace;
  return ret;
}

SPEC_OPS["for"]=sf_floop;

function sf_jscode(ast,env) {
  noSemi= true;
  return tnodeEx(
    nth(ast,1).toString().
    replace(REGEX.dquoteHat,"").
    replace(REGEX.dquoteEnd,""));
}

SPEC_OPS["js#"]=sf_jscode;

function sf_macro(ast,env) {
  let p2=ast[2],
      p3=ast.slice(3);
  ast=[ ast[0], ast[1],
        [types._symbol("fn*"), p2].concat(p3)];
  let a2=ast[2];
  let a1=ast[1].toString();
  let func = repl.eval(a2, env);
  func._ismacro_ = true;
  macros.CACHE[a1]=func;
  return tnode();
}

SPEC_OPS["defmacro"]=sf_macro;

function sf_unary(ast,env) {
  transpileAtoms(ast,env);
  return tnodeEx(["(", nth(ast,0) , nth(ast,1), ")"]);
}

regoBuiltins(sf_unary, "unary");


function spitExterns() {
  let p= pad(tabspace),
      ks= Object.keys(EXTERNS),
      s="";

  if (ks.length > 0) {
    s= Object.keys(EXTERNS).map(function(k) {
              return p + k + ": " + k;
       }).join(",\n");
    s= "\n\nmodule.exports = {\n" +  s +  "\n};\n\n";
  }

  return s;
}

function transpileCode(codeStr, fname, srcMap_Q) {

  if (!macros.loaded_Q) {
    macros.load();
  }

  indent= -tabspace;
  EXTERNS= {};
  NSPACES = [];

  let outNode= transpileTree(parse(codeStr, fname)),
      extra= spitExterns();
  outNode.prepend(banner);

  if (srcMap_Q) {
    let outFile= path.basename(fname, ".kirby") + ".js",
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

function transpileXXX(code, file, smap_Q) {
  try {
    return transpileCode(code, file, smap_Q);
  } catch (e) {
    console.log(e.stack);
    throw e;
  }
}

function transpileWithSrcMap(code, file) {
  return transpileXXX(code, file, true);
}

function transpile(code, file) {
  return transpileXXX(code, file, false);
}

function parseWithSourceMap(codeStr, fname) {
  let outNode= transpileTree(parse(codeStr, fname));
  outNode.prepend(MODULE-BANNER);
  return outNode.toStringWithSourceMap();
}

var version= MODULE-VERSION;


module.exports = {
  transpileWithSrcMap: transpileWithSrcMap,
  transpile: transpile,
  parseWithSourceMap: parseWithSourceMap,
  version: version
};

