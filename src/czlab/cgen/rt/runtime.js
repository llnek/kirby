/*Auto generated by Kirby - v1.0.0 czlab.kirby.runtime Sun Oct 15 2017 23:11:57 GMT-0700 (PDT)*/

var parser= require("../bl/parser");
var readline= require("readline");
var macros= require("../bl/macros");
var types= require("../bl/types");
var std= require("../bl/stdlib");
var rt= require("../rt/toolkit");
var env= require("../bl/env");
;
var Env = env.Env;
;
//
function dbg(obj) {
return std.println("DBG-RT: ",types.pr_obj(obj,true));
}

//
function readAST(s) {
return (function (ret) {
((1 === ret.length) ?
  ret = first(ret) :
  null);
return ret;
})(parser.parser(s));
}

//
function isPair(x) {
return (types.sequential_QUERY(x)&&std.not_empty(x));
}

//
function quasiquote(ast) {
return ((!isPair(ast)) ?
  [
    types.symbol("quote"),
    ast
  ] :
  ((types.symbol_QUERY(first(ast))&&(first(ast).value === "unquote")) ?
    second(ast) :
    ((isPair(first(ast))&&(first(first(ast)).value === "splice-unquote")) ?
      [
        types.symbol("concat*"),
        second(first(ast)),
        quasiquote(ast.slice(1))
      ] :
      (true ?
        (function (a0,a1) {
        return [
          types.symbol("cons*"),
          quasiquote(a0),
          quasiquote(a1)
        ];
        })(first(ast),ast.slice(1)) :
        null))));
}

//
function isMacroCall_QUERY(ast,env) {
return (types.list_QUERY(ast)&&types.symbol_QUERY(first(ast))&&macros.get(types.symbol_s(first(ast))));
}

//
function expandMacro(ast,env,mc) {
return (function (ret) {
return ret;
})(macroexpand(ast,env));
}

//
function macroexpand(ast,env) {
let isM_QUERY = isMacroCall_QUERY(ast,env);
let mac = null;
let cmd = (isM_QUERY ?
  first(ast) :
  "");
;
(function () {
for (;isMacroCall_QUERY(ast,env);) {
    cmd = types.symbol_s(first(ast));
  mac = macros.get(cmd);
  ast = mac.apply(mac,ast.slice(1));
;
}
}).call(this);
return ast;
}

//
function evalAst(ast,env) {
return (types.keyword_QUERY(ast) ?
  ["\"",ast.value,"\""].join("") :
  (std.string_QUERY(ast) ?
    types.unwrap_str(ast) :
    (types.symbol_QUERY(ast) ?
      env.get(ast) :
      (types.list_QUERY(ast) ?
        std.map(function (a) {
        return compute(a,env);
        },ast) :
        (types.vector_QUERY(ast) ?
          (function (v) {
          v["__isvector__"] = true;
          return v;
          })(std.map(function (a) {
          return compute(a,env);
          },ast)) :
          ((false&&types.hashmap_QUERY(ast)) ?
            (function (m) {
            forkeys([
              k,
              ast
            ],m[compute(k,env)] = compute(ast[k],env));
            return m;
            })({}) :
            (types.map_QUERY(ast) ?
              (function (m) {
              (function () {
for (var i = 0; (i < ast.length); i = (i+2)) {
                                m[compute(ast[i],env)] = compute(ast[(i+1)],env);
;
              }
}).call(this);
              return m;
              })({}) :
              (true ?
                ast :
                null))))))));
}

//
function handleAND(ast,env) {
return (function (ret,skip_QUERY) {
(function () {
for (var i = 1; ((!skip_QUERY)&&(i < ast.length)); i = (i+1)) {
    ret = compute(ast[i],env);
  (ret ?
    null :
    skip_QUERY = true);
;
}
}).call(this);
return ret;
})(true,false);
}

//
function handleOR(ast,env) {
return (function (ret,skip_QUERY) {
(function () {
for (var i = 1; ((!skip_QUERY)&&(i < ast.length)); i = (i+1)) {
    ret = compute(ast[i],env);
  (ret ?
    skip_QUERY = true :
    null);
;
}
}).call(this);
return ret;
})(null,false);
}

//
function handleLet(ast,env) {
let e = new Env(env);
let a1 = ast[1];
;
(function () {
for (var i = 0; (i < a1.length); i = (i+2)) {
    e.set(a1[i],compute(a1[(i+1)],e));
;
}
}).call(this);
return [
  true,
  a2,
  e
];
}

//
function handleMacro(ast,env) {
let rc = [
  ast[0],
  ast[1],
  std.concat([
    types.symbol("fn*"),
    ast[2]
  ],ast.slice(3))
];
let a2 = rc[2];
let a1 = rc[1];
let func = compute(a2,env);
;
func["_ismacro_"] = true;
return env.set(a1,func);
}

//
function handleTry(ast,env) {
let a1 = ast[1];
let a2 = ast[2];
;
return (function() {
try {
return compute(a1,env);

} catch (ex) {
return ((a2&&("catch*" === first(a2).value)) ?
  ((ex instanceof Error) ?
    ex = ex.message :
    null) :
  compute(a2[2],new Env(env,[
    a2[1]
  ],[
    ex
  ])));
;
}
}).call(this);
}

//
function handleIf(ast,env) {
let c = compute(ast[1],env);
let a2 = ast[2];
let a3 = ast[3];
;
return (((c === null)||(false === c)) ?
  ((typeof(a3) === "undefined") ?
    null :
    a3) :
  a2);
}

//
function handleForm(ast,env) {
let el = evalAst(ast,env);
let f = el[0];
;
return (f.__ast__ ?
  [
    true,
    f.__ast__,
    f.__gen_env__(el.slice(1))
  ] :
  [
    false,
    f.apply(this,el.slice(1)),
    env
  ]);
}

//
function computeLoop(ast,env) {
let ok_QUERY = true;
let ret = null;
;
(function () {
for (;ok_QUERY;) {
    ast = macroexpand(ast,env);
  ok_QUERY = ((!types.list_QUERY(ast)) ?
    (function (G__1) {
    ret = evalAst(ast,env);
    return G__1;
    })(false) :
    ((0 === ast.length) ?
      (function (G__2) {
      ret = ast;
      return G__2;
      })(false) :
      (("and*" === ast[0].value) ?
        (function (G__3) {
        ret = handleAND(ast,env);
        return G__3;
        })(false) :
        (("or*" === ast[0].value) ?
          (function (G__4) {
          ret = handleOR(ast,env);
          return G__4;
          })(false) :
          (("def*" === ast[0].value) ?
            (function (G__5) {
            ret = env.set(a1,compute(a2,env));
            return G__5;
            })(false) :
            (("let*" === ast[0].value) ?
              (function (rc) {
              ast = rc[1];
              env = rc[2];
              return rc[0];
              })(handleLet(ast,env)) :
              (("quote" === ast[0].value) ?
                (function (G__6) {
                ret = ast[1];
                return G__6;
                })(false) :
                (("quasiquote" === ast[0].value) ?
                  (function (G__7) {
                  ast = quasiquote(ast[1]);
                  return G__7;
                  })(true) :
                  (("defmacro" === ast[0].value) ?
                    (function (G__8) {
                    ret = handleMacro(ast,env);
                    return G__8;
                    })(false) :
                    (("macroexpand" === ast[0].value) ?
                      (function (G__9) {
                      ret = macroexpand(ast[1],env);
                      return G__9;
                      })(false) :
                      (("try*" === ast[0].value) ?
                        (function (G__10) {
                        ret = handleTry(ast,env);
                        return G__10;
                        })(false) :
                        (("do*" === ast[0].value) ?
                          (function (G__11) {
                          evalAst(ast.slice(1,-1),env);
                          ast = ast[(ast.length-1)];
                          return G__11;
                          })(true) :
                          (("if*" === ast[0].value) ?
                            (function (G__12) {
                            handleIf(ast,env);
                            return G__12;
                            })(true) :
                            (("fn*" === ast[0].value) ?
                              (function (G__13) {
                              ret = types.fn_wrap(compute,Env,ast[2],env,ast[1]);
                              return G__13;
                              })(false) :
                              (true ?
                                (function (rc) {
                                (first(rc) ?
                                                                    (function() {
                                  ast = rc[1];
                                  return env = rc[2];
                                  }).call(this) :
                                                                    (function() {
                                  return ret = rc[1];
                                  }).call(this));
                                return rc[0];
                                })(handleForm(ast,env)) :
                                null)))))))))))))));
;
}
}).call(this);
return ret;
}

//
function compute(ast,env) {
(env ?
  null :
  env = global_env);
let ret = computeLoop(ast,env);
;
return ((typeof(ret) === "undefined") ?
  null :
  ret);
}

//
function show(exp) {
return types.pr_obj(exp);
}

//
function newEnv() {
return (function (ret) {
(function (G__14) {
return Object.keys(G__14).forEach(function (k) {
return (function (v,k) {
return ret.set(types.symbol(n),v);
})(G__14[k],k,G__14);
});
})(rt);
ret.set(types.symbol("eval"),function (ast) {
return compute(ast,ret);
});
ret.set(types.symbol("*ARGV*"),[]);
ret.set(types.symbol("*host-language*"),"javascript");
ret.set(types.symbol("*gensym-counter*"),types.atom(0));
return ret;
})(new Env());
}

var prefix = "kalaso> ";
;
var run_repl = function () {
let rl = readline.createInterface(process.stdin,process.stdout);
;
rl.on("line",function (line) {
(function() {
try {
return (line ?
  std.println(rep(line)) :
  null);

} catch (err) {
return std.println(err);
;
}
}).call(this);
rl.setPrompt(prefix,prefix.length);
return rl.prompt();
});
rl.on("close",function () {
std.println("Bye!");
return process.exit(0);
});
std.println([prefix,"Kalaso REPL v1.0.0"].join(""));
rl.setPrompt(prefix,prefix.length);
return rl.prompt();
};
;
var rep = function (s) {
return show(compute(readAST(s)));
};
;
var global_env = new Env();
;
//
function runRepl() {
init();
return run_repl();
}

var macro_assert = "\n  (defmacro assert* [c msg] (if* c true (throw* msg)))";
;
var macro_cond = "\n  (defmacro cond* [&xs]\n    (if* (> (count* xs) 0)\n      (list* 'if*\n            (first* xs)\n            (nth* xs 1)\n            (cons* 'cond* (rest* (rest* xs))))))";
;
//
function init() {
global_env = newEnv();
global_env.set(types.symbol("*host-language*"),"javascript");
rep(macro_cond);
return rep(macro_assert);
}

//
function globalEnv() {
return global_env;
}



module.exports = {
  expandMacro: expandMacro,
  compute: compute,
  newEnv: newEnv,
  runRepl: runRepl,
  globalEnv: globalEnv
};
