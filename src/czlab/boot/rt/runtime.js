// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var parser = require('../bl/parser');
var readline = require("readline");
var types = require("../bl/types");
var std = require("../bl/stdlib");
var rt = require("../rt/toolkit");
var env = require("../bl/env");
var Env=env.Env;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var loadedMacros_Q=false;
var CACHE= {};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function loadMacros() {
  if (!loadedMacros_Q) {
    loadedMacros_Q=true;
    require("../bl/macros.ky");
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function setMacro(cmd, func) {
  if (cmd && func) {
    if (!cmd.includes("/")) {
      let c=global_env.peekNSP();
      if (!c) throw new Error("missing namespace");
      cmd=c+"/"+cmd;
    }
    //console.log("adding macro ==== " + cmd);
    CACHE[cmd]=func;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function getMacro(x) {
  if (x.includes("/")) {
    return CACHE[x];
  }
  let nsp=global_env.peekNSP();
  let ret;
  if (nsp) {
    ret= CACHE[nsp+"/"+x];
  }
  if (!ret) ret = CACHE["czlab.kirby.bl.macros/"+x];
  if (!ret) ret = CACHE["czlab.kirby.macros/"+x];
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function dbg(obj) {
  std.println("DBG-RT: " + types.pr_obj(obj, true));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function readAST(s) {
  let ret= parser.parser(s);
  if (ret.length===1) ret= ret[0];
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function isPair(x) {
  return types.sequential_p(x) && x.length > 0;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function quasiquote(ast) {
  if (!isPair(ast)) {
      return [types.symbol("quote"), ast];
  }
  else if (types.symbol_p(ast[0]) && ast[0].value === 'unquote') {
      return ast[1];
  }
  else if (isPair(ast[0]) && ast[0][0].value === 'splice-unquote') {
      return [types.symbol("concat*"),
              ast[0][1],
              quasiquote(ast.slice(1))];
  } else {
    let a0=ast[0],a1=ast.slice(1);
      return [types.symbol("cons*"), quasiquote(a0), quasiquote(a1)];
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function isMacroCall(ast, env) {
  return types.list_p(ast) &&
         types.symbol_p(ast[0]) &&
         getMacro(types.symbol_s(ast[0]));
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function expandMacro(ast,env, mc) {
  let ret= macroexpand(ast,env);
  //dbg(ret);
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function macroexpand(ast, env) {
  var isM=isMacroCall(ast, env);
  var cmd= isM ? ast[0] : "";
  if (isM) {
    //core.println("macro-in("+cmd+"):", core.pr_obj(ast, true));
  }
  while (isMacroCall(ast, env)) {
    var cmd= types.symbol_s(ast[0]),
        mac = getMacro(cmd);
//core.println("macro(before-"+cmd+":", core.pr_obj(ast, true));
        ast = mac.apply(mac, ast.slice(1));
//core.println("macro(after-"+cmd+":", core.pr_obj(ast, true));
  }
  if (isM) {
    //core.println("macro-out("+cmd+"):", core.pr_obj(ast, true));
  }
  return ast;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function evalAst(ast, env) {
  if (types.keyword_p(ast)) {
    return "\"" + ast.value + "\"";
  }
  if (types.symbol_p(ast)) {
    return env.get(ast);
  }
  if (types.list_p(ast)) {
    return ast.map(function(a) { return compute(a, env); });
  }
  if (types.vector_p(ast)) {
    let v = ast.map(function(a) { return compute(a, env); });
    v.__isvector__ = true;
    return v;
  }
  if (false && types.hashmap_p(ast)) {
    let new_hm = {};
    for (k in ast) {
      new_hm[compute(k, env)] = compute(ast[k], env);
    }
    return new_hm;
  }
  if (types.map_p(ast)) {
    let k, new_hm = {};
    for (var i=0; i < ast.length; i=i+2) {
      new_hm[ compute(ast[i], env) ] = compute(ast[i+1], env);
    }
    return new_hm;
  }
  if (types.primitive_p(ast)) {

  }

  if (std.string_p(ast)) {
    return types.unwrap_str(ast);
  }

  return ast;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function computeLoop(ast, env) {
  while (true) {

    //std.println("EVALLOOP:", types.pr_obj(ast, true));

    if (!types.list_p(ast)) {
        return evalAst(ast, env);
    }

    // apply list
    ast = macroexpand(ast, env);
    if (!types.list_p(ast)) {
        return evalAst(ast, env);
    }
    if (ast.length === 0) {
        return ast;
    }

    //core.println("SWITCH:", core.pr_obj(ast, true));

    let t, a0 = ast[0], a1 = ast[1], a2 = ast[2], a3 = ast[3];
    switch (a0.value) {
    case "is-and?":
        t=true;
        for (var i=1; i < ast.length; ++i) {
          t=compute(ast[i],env);
          if (!t) break;
        }
        return t;
    case "is-or?":
        t=nil;
        for (var i=1; i < ast.length; ++i) {
          t=compute(ast[i],env);
          if (t) break;
        }
        return t;
    case "def*":
        let res = compute(a2, env);
        return env.set(a1, res);
    case "let*":
        let let_env = new Env(env);
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
    case "macro*":
        let p2=ast[2], p3=ast.slice(3);
        let func= compute([types.symbol("fn*"), p2].concat(p3),env);
        func._ismacro_ = true;
        a1=ast[1];
        return env.set(a1, func);
    case "macroexpand":
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
    case "do*":
        evalAst(ast.slice(1, -1), env);
        ast = ast[ast.length-1];
        break;
    case "if*":
        var cond = compute(a1, env);
        if (cond === null || cond === false) {
            ast = (typeof a3 !== "undefined") ? a3 : null;
        } else {
            ast = a2;
        }
        break;
    case "fn*":
        return types.fn_wrap(compute, Env, a2, env, a1);
    default:
        let el = evalAst(ast, env), f = el[0];
        if (f.__ast__) {
            ast = f.__ast__;
            env = f.__gen_env__(el.slice(1));
        } else {
            return f.apply(f, el.slice(1));
        }
    }
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function compute(ast, env) {
  //std.println("EVAL:", types.pr_obj(ast, true));
  if (!env) env=global_env;
  let result = computeLoop(ast, env);
  return (typeof result !== "undefined") ? result : null;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function show(exp) {
    return types.pr_obj(exp, true);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function newEnv() {
  let ret=new Env();
  for (var n in rt) {
    //console.log("n===== "+n);
    ret.set(types.symbol(n), rt[n]);
  }
  ret.set(types.symbol('eval'), function(ast) {
    return compute(ast, ret);
  });
  ret.set(types.symbol('*ARGV*'), []);
  ret.set(types.symbol("*host-language*"), "javascript");
  ret.set(types.symbol("*gensym-counter*"), types.atom(0));
  return ret;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var prefix= "kirby> ";
var run_repl=function() {
  let rl= readline.createInterface(
            process.stdin, process.stdout);
  rl.on("line",
    function(line) {
      try {
        if (line) { std.println(rep(line)); }
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

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var rep = function(str) { return show(compute(readAST(str))); };
var global_env=new Env();
function runRepl() {
  init();
  run_repl();
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var macro_assert=`
(macro* assert* [c msg]
  (if* c true (throw* msg)))
`;
var macro_cond=`
(macro* cond* [&xs]
  (if* (> (count* xs) 0)
    (list* 'if*
          (first* xs)
          (nth* xs 1)
          (cons* 'cond* (rest* (rest* xs))))))`;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function init() {
  global_env=newEnv();
  global_env.set(types.symbol("*host-language*"), "javascript");
  //rep(macro_cond);
  //rep(macro_assert);
  loadMacros();
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {
  expandMacro: expandMacro,
  eval: compute,
  init: init,
  getMacro: getMacro,
  setMacro: setMacro,
  globalEnv: function() { return global_env; },
  repl: runRepl,
  newEnv: newEnv
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

