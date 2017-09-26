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

//doto





