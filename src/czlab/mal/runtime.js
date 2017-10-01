var types = require('./types');
var readline = require('readline');
var macros=require("./macros");
var parser = require('./parser');
var printer = require('./printer');
var Env = require('./env').Env;
var JS= require("./interop");
var core = require('./core');

//
function dbg(obj) {
  printer.println("DBG-RT: " + printer._pr_str(obj, true));
}

//
function readAST(s) {
  return parser.parser(s);
}

function isPair(x) {
  return types._sequential_Q(x) && x.length > 0;
}

function quasiquote(ast) {

  if (!isPair(ast)) {
      return [types._symbol("quote"), ast];
  } else if (types._symbol_Q(ast[0]) && ast[0].value === 'unquote') {
      return ast[1];
  } else if (isPair(ast[0]) && ast[0][0].value === 'splice-unquote') {
      return [types._symbol("concat"),
              ast[0][1],
              quasiquote(ast.slice(1))];
  } else {
    let a0=ast[0],a1=ast.slice(1);
      return [types._symbol("cons"),
              quasiquote(a0),
              quasiquote(a1)];
  }
}

//
function isMacroCall(ast, env) {
  return types._list_Q(ast) &&
         types._symbol_Q(ast[0]) &&
         macros.get(types._symbol_S(ast[0]));
}

function expandMacro(ast,env, mc) {
  let ret= macroexpand(ast,env);
  //dbg(ret);
  return ret;
}

//
function macroexpand(ast, env) {
  var isM=isMacroCall(ast, env);
  var cmd= isM ? ast[0] : "";
  if (isM) {
    //printer.println("macro-in("+cmd+"):", printer._pr_str(ast, true));
  }
  while (isMacroCall(ast, env)) {
    var cmd= types._symbol_S(ast[0]),
        mac = macros.get(cmd);
//printer.println("macro(before-"+cmd+":", printer._pr_str(ast, true));
        ast = mac.apply(mac, ast.slice(1));
//printer.println("macro(after-"+cmd+":", printer._pr_str(ast, true));
  }
  if (isM) {
    //printer.println("macro-out("+cmd+"):", printer._pr_str(ast, true));
  }
  return ast;
}

//
function evalAst(ast, env) {
  if (types._keyword_Q(ast)) {
    return "\"" + ast.value + "\"";
  }
  else if (types._symbol_Q(ast)) {
    return env.get(ast);
    try {
    } catch (e) {
      dbg(ast);
    }
  } else if (types._list_Q(ast)) {
    return ast.map(function(a) { return compute(a, env); });
  } else if (types._vector_Q(ast)) {
    var v = ast.map(function(a) { return compute(a, env); });
    v.__isvector__ = true;
    return v;
  } else if (false && types._hash_map_Q(ast)) {
    var new_hm = {};
    for (k in ast) {
        new_hm[compute(k, env)] = compute(ast[k], env);
    }
    return new_hm;
  }
  else if (types._map_Q(ast)) {
      var k, new_hm = {};
      for (var i=0; i < ast.length; i=i+2) {
        new_hm[ compute(ast[i], env) ] = compute(ast[i+1], env);
      }
      return new_hm;
  }
  else {
      return ast;
  }
}

//
function computeLoop(ast, env) {
    while (true) {

    //printer.println("EVAL:", printer._pr_str(ast, true));

    if (!types._list_Q(ast)) {
        return evalAst(ast, env);
    }

    // apply list
    ast = macroexpand(ast, env);
    if (!types._list_Q(ast)) {
        return evalAst(ast, env);
    }
    if (ast.length === 0) {
        return ast;
    }

    //printer.println("SWITCH:", printer._pr_str(ast, true));

    var a0 = ast[0], a1 = ast[1], a2 = ast[2], a3 = ast[3];
    switch (a0.value) {
      //case "set!": var res = compute(a2,repl_env); return repl_env.set(a1,res);
    case "def!":
        var res = compute(a2, env);
        return env.set(a1, res);
    case "let*":
        var let_env = new Env(env);
        for (var i=0; i < a1.length; i+=2) {
            let_env.set(a1[i], compute(a1[i+1], let_env));
        }
        ast = a2;
        env = let_env;
        break;
    case "quote":
        return a1;
    case "quasiquote":
        ast = quasiquote(a1);
        break;
    case 'defmacro':
        let p2=ast[2],
            p3=ast.slice(3);
        ast=[ast[0], ast[1],
             [types._symbol("fn*"), p2].concat(p3)]
        a2=ast[2];
        a1=ast[1];
        var func = compute(a2, env);
        func._ismacro_ = true;
        return env.set(a1, func);
    case 'macroexpand':
        return macroexpand(a1, env);
    case "try*":
        try {
            return compute(a1, env);
        } catch (exc) {
            if (a2 && a2[0].value === "catch*") {
                if (exc instanceof Error) { exc = exc.message; }
                return compute(a2[2], new Env(env, [a2[1]], [exc]));
            } else {
                throw exc;
            }
        }
    case "do":
        evalAst(ast.slice(1, -1), env);
        ast = ast[ast.length-1];
        break;
    case "if":
        var cond = compute(a1, env);
        if (cond === null || cond === false) {
            ast = (typeof a3 !== "undefined") ? a3 : null;
        } else {
            ast = a2;
        }
        break;
    case "fn*":
        return types._function(compute, Env, a2, env, a1);
    default:
        var el = evalAst(ast, env), f = el[0];

        if (f.__ast__) {
            ast = f.__ast__;
            env = f.__gen_env__(el.slice(1));
        } else {
            return f.apply(f, el.slice(1));
        }
    }

    }
}

//
function compute(ast, env) {
  if (!env) env=global_env;
  var result = computeLoop(ast, env);
  return (typeof result !== "undefined") ? result : null;
}

// print
function show(exp) {
    return printer._pr_str(exp, true);
}

function newEnv() {
  let ret=new Env();
  for (var n in core.ns) {
    ret.set(types._symbol(n), core.ns[n]);
  }
  ret.set(types._symbol('eval'), function(ast) {
    return compute(ast, ret);
  });
  ret.set(types._symbol('*ARGV*'), []);
  ret.set(types._symbol("*host-language*"), "javascript");
  ret.set(types._symbol("*gensym-counter*"), types._atom(0));
  return ret;
}

// repl
var prefix= "kirby> ";
var run_repl=function() {
  let rl= readline.createInterface(
            process.stdin, process.stdout);
  rl.on("line",
    function(line) {
      try {
        if (line) { printer.println(rep(line)); }
      } catch (err) {
        console.log(err);
      }
      rl.setPrompt(prefix, prefix.length);
      rl.prompt();
    });

  rl.on("close",
    function() {
      console.log("Bye!");
      process.exit(0);
    });

  console.log(prefix + "Kirby REPL v1.0.0");
  rl.setPrompt(prefix, prefix.length);
  rl.prompt();
}

var rep = function(str) { return show(compute(readAST(str))); };
var global_env=new Env();
function runRepl() {
  init();
  run_repl();
}

function init() {
  global_env=newEnv();
  rep("(def! gensym (fn* [] (symbol (str \"G__\" (swap! *gensym-counter* (fn* [x] (+ 1 x)))))))");
  rep("(def! not (fn* (a) (if a false true)))");
  //rep("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \")\")))))");
}
module.exports= {
  expandMacro: expandMacro,
  eval: compute,
  init: init,
  globalEnv: function() { return global_env; },
  repl: runRepl,
  newEnv: newEnv
};
