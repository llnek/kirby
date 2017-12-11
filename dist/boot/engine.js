/*Auto generated by Kirby - v1.0.0 czlab.kirby.engine Sun Dec 10 2017 18:55:25 GMT-0800 (PST)*/

const readline = require("readline");
const fs = require("fs");
const parser = require("./parser");
const std = require("./stdlib");
const pairs_QUERY = std["pairs_QUERY"];
const stringify = std["stringify"];
const contains_QUERY = std["contains_QUERY"];
const LambdaArg = std["LambdaArg"];
const Keyword = std["Keyword"];
const not_DASH_empty = std["not_DASH_empty"];
const object_QUERY = std["object_QUERY"];
const Symbol = std["Symbol"];
const into_BANG = std["into_BANG"];
const prn = std["prn"];
const Atom = std["Atom"];
const symbol = std["symbol"];
const swap_BANG = std["swap_BANG"];
const atom = std["atom"];
const vector = std["vector"];
const vector_QUERY = std["vector_QUERY"];
const list_QUERY = std["list_QUERY"];
const map_QUERY = std["map_QUERY"];
const some_QUERY = std["some_QUERY"];
const typeid = std["typeid"];
const sequential_QUERY = std["sequential_QUERY"];
const conj_BANG = std["conj_BANG"];
const count = std["count"];
const last = std["last"];
const pop_BANG = std["pop_BANG"];
const opt_QUERY__QUERY = std["opt_QUERY__QUERY"];
const keyword_QUERY = std["keyword_QUERY"];
const symbol_QUERY = std["symbol_QUERY"];
const seq = std["seq"];
const kirbystdlibref = std;
////////////////////////////////////////////////////////////////////////////////
//name: [assertSymbol] in file: engine.ky near line: 29
const assertSymbol = function(k) {
  return ((!(k instanceof Symbol)) ?
    (function() {
      throw new Error("env.xxx key must be a symbol") ;
    }).call(this) :
    null);
};
//Lexical Environment
class LEXEnv {
  ////////////////////////////////////////////////////////////////////////////////
  //name: [constructor] in file: engine.ky near line: 37
  //Create and initialize
  //a new env with these symbols,
  //and optionally a parent env
  constructor(parent, vars, exprs) {
    (this["nspaces"] = [], this["data"] = {}, this["parent"] = null);
    if (parent) {
      this["parent"] = parent;
    }
    for (let i = 0, e = null, ev = null, sz = kirbystdlibref.count(vars), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
      (e = vars[i], ev = e.value);
      if ( (ev === "&") ) {
        this.data[[vars[i + 1]].join("")] = Array.prototype.slice.call(exprs, i);
        ____break = true;
      } else {
        if (ev.startsWith("&")) {
          this.data[ev.slice(1)] = Array.prototype.slice.call(exprs, i);
          ____break = true;
        } else {
          if (true) {
            this.data[ev] = exprs[i];
          }
        }
      }
    }
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [find] in file: engine.ky near line: 58
  //Find the env
  //containing this symbol
  find(k) {
    assertSymbol(k);
    return (contains_QUERY(this.data, k.value) ?
      this :
      (some_QUERY(this.parent) ?
        this.parent.find(k) :
        null));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [set] in file: engine.ky near line: 65
  //Bind this symbol,
  //value to this env
  set(k, v) {
    assertSymbol(k);
    this.data[k.value] = v;
    return v;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [get] in file: engine.ky near line: 70
  //Get value of
  //this symbol
  get(k) {
    assertSymbol(k);
    let env = this.find(k);
    return (env ?
      env.data[k.value] :
      k.value);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [pushNSP] in file: engine.ky near line: 77
  //Add a namespace
  pushNSP(nsp) {
    return conj_BANG(this.nspaces, [nsp].join(""));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [peekNSP] in file: engine.ky near line: 80
  //Returns the
  //last added namespace
  peekNSP() {
    return last(this.nspaces);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [popNSP] in file: engine.ky near line: 84
  //Return and remove
  //the last added namespace
  popNSP() {
    return pop_BANG(this.nspaces)[0];
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [firstNSP] in file: engine.ky near line: 88
  //Get the first
  //added namespace
  firstNSP() {
    return this.nspaces[0];
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [countNSPCache] in file: engine.ky near line: 92
  //Count n# of
  //added namespaces
  countNSPCache() {
    return kirbystdlibref.count(this.nspaces);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //name: [resetNSPCache] in file: engine.ky near line: 96
  //Clear all namespaces
  resetNSPCache() {
    this["nspaces"] = [];
    return null;
  }
}
////////////////////////////////////////////////////////////////////////////////
//name: [Function.prototype.clone] in file: engine.ky near line: 104
Function.prototype.clone = function() {
  let that = this;
  let tmp = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return that.apply(this, ____args);
  };
  let G__1 = that;
  Object.entries(G__1).forEach(function(e) {
    return (function(v, k) {
      return tmp[k] = v;
    })(e[1], e[0]);
  });
  return tmp;
};
////////////////////////////////////////////////////////////////////////////////
//name: [prnStr] in file: engine.ky near line: 112
const prnStr = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.map(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return prn(____args[0]);
  }).join(" ");
};
////////////////////////////////////////////////////////////////////////////////
//name: [prnLn] in file: engine.ky near line: 116
const prnLn = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.map(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return prn(____args[0]);
  }).forEach(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (console ?
      console.log([____args[0]].join("")) :
      null);
  });
};
////////////////////////////////////////////////////////////////////////////////
//name: [slurp] in file: engine.ky near line: 120
const slurp = function(f) {
  return fs.readFileSync(f, "utf-8");
};
////////////////////////////////////////////////////////////////////////////////
//name: [clone] in file: engine.ky near line: 124
const clone = function(obj) {
  let oid = typeid(obj);
  return (function() {
    let S____5;
    switch (oid) {
      case "vector":
      case "map":
      case "list":
        S____5 = into_BANG(oid, Array.prototype.slice.call(obj));
        break;
      case "array":
        S____5 = Array.prototype.slice.call(obj);
        break;
      case "object":
        S____5 = seq(obj).reduce(function(acc, en) {
          acc[en[0]] = last(en);
          return acc;
        }, {});
        break;
      case "function":
        S____5 = obj.clone();
        break;
      default:
        S____5 = (function() {
          throw new Error(["clone of non-collection: ", oid].join("")) ;
        }).call(this);
        break;
    }
    return S____5;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//name: [cons] in file: engine.ky near line: 143
const cons = function(a, b) {
  return [a].concat(b);
};
////////////////////////////////////////////////////////////////////////////////
//name: [conj] in file: engine.ky near line: 146
const conj = function(arr) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return (list_QUERY(arr) ?
    into_BANG("list", xs.reverse().concat(arr)) :
    (some_QUERY(arr) ?
      into_BANG("vector", arr.concat(xs)) :
      (true ?
        arr :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//name: [fapply] in file: engine.ky near line: 158
const fapply = function(f) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return f.apply(this, xs);
};
////////////////////////////////////////////////////////////////////////////////
//name: [fmap] in file: engine.ky near line: 161
const fmap = function(f, arr) {
  return arr.map(f);
};
var GLOBAL = ((typeof (window) === "undefined") ?
  undefined :
  window);
////////////////////////////////////////////////////////////////////////////////
//name: [resolveJS] in file: engine.ky near line: 167
const resolveJS = function(s) {
  return [(contains_QUERY(s, ".") ?
    eval(/^(.*)\.[^\.]*$/g.exec(s)[1]) :
    GLOBAL), eval(s)];
};
////////////////////////////////////////////////////////////////////////////////
//name: [filterJS] in file: engine.ky near line: 175
const filterJS = function(obj) {
  let s = stringify(obj);
  return (not_DASH_empty(s) ?
    JSON.parse(s) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//name: [withMeta] in file: engine.ky near line: 180
const withMeta = function(obj, m) {
  let ret = clone(obj);
  ret["____meta"] = m;
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [meta] in file: engine.ky near line: 185
const meta = function(obj) {
  if ( (!(Array.isArray(obj) || object_QUERY(obj) || (typeof (obj) === "function"))) ) {
    throw new Error(["can't get metadata from: ", typeid(obj)].join(""));
  }
  return obj["____meta"];
};
////////////////////////////////////////////////////////////////////////////////
//name: [evalJS] in file: engine.ky near line: 193
const evalJS = function(s) {
  return filterJS(eval(s.toString()));
};
////////////////////////////////////////////////////////////////////////////////
//name: [invokeJS] in file: engine.ky near line: 197
const invokeJS = function(method) {
  let xs = Array.prototype.slice.call(arguments, 1);
  let G____6 = resolveJS(method);
  let obj = G____6[0];
  let f = G____6[1];
  return filterJS(f.apply(obj, xs));
};
var toolkit = {
  "is-same?": function(a, b) {
    return (a == b);
  },
  "is-nil?": function(x) {
    return (x === null);
  },
  "obj-type*": std.typeid,
  "gensym*": std.gensym,
  "is-eq?": std.eq_QUERY,
  "is-some?": std.some_QUERY,
  "slice*": function(arr) {
    let xs = Array.prototype.slice.call(arguments, 1);
    return Array.prototype.slice.apply(arr, xs);
  },
  "throw*": function() {
    let xs = Array.prototype.slice.call(arguments, 0);
    return (function() {
      throw new Error(xs.join("")) ;
    }).call(this);
  },
  "#f?": function(x) {
    return (false === x);
  },
  "#t?": function(x) {
    return (true === x);
  },
  "is-str?": function(x) {
    return (typeof (x) === "string");
  },
  "is-keyword?": std.keyword_QUERY,
  "is-symbol?": std.symbol_QUERY,
  "keyword*": std.keyword,
  "symbol*": std.symbol,
  "println*": prnLn,
  "prn*": prnStr,
  "slurp*": slurp,
  "<": function(a, b) {
    return (a < b);
  },
  "<=": function(a, b) {
    return (a <= b);
  },
  ">": function(a, b) {
    return (a > b);
  },
  ">=": function(a, b) {
    return (a >= b);
  },
  "+": function(a, b) {
    return (a + b);
  },
  "-": function(a, b) {
    return (a - b);
  },
  "*": function(a, b) {
    return (a * b);
  },
  "/": function(a, b) {
    return (a / b);
  },
  "not=": function(a, b) {
    return (a !== b);
  },
  "=": function(a, b) {
    return (a === b);
  },
  "is-contains?": std.contains_QUERY,
  "is-vector?": std.vector_QUERY,
  "is-list?": std.list_QUERY,
  "is-map?": std.map_QUERY,
  "hash-map*": std.hashmap,
  "vector*": std.vector,
  "list*": std.list,
  "values*": function(x) {
    return Object.values(x);
  },
  "keys*": function(x) {
    return Object.keys(x);
  },
  "get*": function(m, k) {
    return m[k];
  },
  "not*": function(x) {
    return (x ?
      false :
      true);
  },
  "dec*": function(x) {
    return (x - 1);
  },
  "inc*": function(x) {
    return (x + 1);
  },
  "is-even?": function(n) {
    return (0 === std.modulo(n, 2));
  },
  "is-odd?": function(n) {
    return (1 === std.modulo(n, 2));
  },
  "is-sequential?": std.sequential_QUERY,
  "concat*": std.concat_STAR,
  "count*": std.count,
  "cons*": cons,
  "rest*": function(arr) {
    return (arr ?
      arr.slice(1) :
      []);
  },
  "nth*": function(arr, i) {
    return arr[i];
  },
  "first*": function(arr) {
    return arr[0];
  },
  "is-empty?": function(x) {
    return (0 === std.count(x));
  },
  "not-empty*": std.not_DASH_empty,
  "apply*": fapply,
  "map*": fmap,
  "evens": function(n) {
    return (0 === mod(n, 2));
  },
  "odds": function(n) {
    return (1 === mod(n, 2));
  },
  "type*": function(x) {
    return typeof (x);
  },
  "meta*": meta,
  "conj*": conj,
  "seq*": std.seq,
  "is-atom?": std.atom_QUERY,
  "atom*": std.atom,
  "deref*": std.deref,
  "reset*": std.reset_BANG,
  "swap*": std.swap_BANG,
  "with-meta*": withMeta,
  "js-eval*": evalJS,
  "js*": invokeJS
};
var loadedMacros_QUERY = false;
var CACHE = {};
////////////////////////////////////////////////////////////////////////////////
//name: [loadMacros] in file: engine.ky near line: 305
const loadMacros = function() {
  if ( (!loadedMacros_QUERY) ) {
    loadedMacros_QUERY = true;
    require("./macros.ky");
  }
  return null;
};
////////////////////////////////////////////////////////////////////////////////
//name: [setMacro] in file: engine.ky near line: 311
//Register a new macro
const setMacro = function(cmd, func) {
  if ( (cmd && func) ) {
    cmd = [cmd].join("");
    if ( (!contains_QUERY(cmd, "/")) ) {
      let c = global_env.peekNSP();
      if ( (!c) ) {
        throw new Error("missing namespace");
      }
      cmd = [c, "/", cmd].join("");
    }
    CACHE[cmd] = func;
  }
  return null;
};
////////////////////////////////////////////////////////////////////////////////
//name: [getMacro] in file: engine.ky near line: 323
//Get macro
const getMacro = function(cmd) {
  let nsp = null;
  let ret = null;
  cmd = [cmd].join("");
  if (contains_QUERY(cmd, "/")) {
    ret = CACHE[cmd];
  } else {
    nsp = global_env.peekNSP();
    if (nsp) {
      ret = CACHE[[nsp, "/", cmd].join("")];
    }
    if ( (!ret) ) {
      ret = CACHE[["czlab.kirby.macros/", cmd].join("")];
    }
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [dbg] in file: engine.ky near line: 338
const dbg = function(obj) {
  return (console ?
    console.log(["DBG-RT: ", prn(obj)].join("")) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//name: [readAST] in file: engine.ky near line: 342
//Returns the AST
const readAST = function(s) {
  let ret = parser.parse(s);
  if ( (1 === kirbystdlibref.count(ret)) ) {
    ret = ret[0];
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [isList?] in file: engine.ky near line: 349
//Returns true
//if a non-empty list
const isList_QUERY = function(x) {
  return (sequential_QUERY(x) && not_DASH_empty(x));
};
////////////////////////////////////////////////////////////////////////////////
//name: [quasiquote] in file: engine.ky near line: 355
const quasiquote = function(ast) {
  return ((!isList_QUERY(ast)) ?
    [symbol("quote"), ast] :
    ((symbol_QUERY(ast[0]) && (ast[0] == "unquote")) ?
      ast[1] :
      ((isList_QUERY(ast[0]) && (ast[0][0] == "splice-unquote")) ?
        [symbol("concat*"), ast[0][1], quasiquote(ast.slice(1))] :
        (true ?
          (function() {
            let a0 = ast[0];
            let a1 = ast.slice(1);
            return [symbol("cons*"), quasiquote(a0), quasiquote(a1)];
          }).call(this) :
          null))));
};
////////////////////////////////////////////////////////////////////////////////
//name: [isMacroCall?] in file: engine.ky near line: 376
const isMacroCall_QUERY = function(ast, env) {
  return (pairs_QUERY(ast) && symbol_QUERY(ast[0]) && getMacro([ast[0]].join("")));
};
////////////////////////////////////////////////////////////////////////////////
//name: [expandMacro] in file: engine.ky near line: 382
const expandMacro = function(ast, env, mc) {
  return mexpand(ast, env);
};
////////////////////////////////////////////////////////////////////////////////
//name: [mexpand] in file: engine.ky near line: 386
const mexpand = function(ast, env) {
  let isM_QUERY = isMacroCall_QUERY(ast, env);
  let mac = null;
  let cmd = (isM_QUERY ?
    ast[0] :
    "");
  for (let ____break = false; ((!____break) && isMacroCall_QUERY(ast, env));) {
    (cmd = [ast[0]].join(""), mac = getMacro(cmd), ast = mac.apply(mac, ast.slice(1)));
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//name: [evalAst] in file: engine.ky near line: 396
const evalAst = function(ast, env) {
  return (keyword_QUERY(ast) ?
    ast.value :
    ((typeof (ast) === "string") ?
      std.unwrap_DASH_str(ast) :
      (symbol_QUERY(ast) ?
        env.get(ast) :
        (pairs_QUERY(ast) ?
          ast.map(function() {
            let ____args = Array.prototype.slice.call(arguments);
            return compute(____args[0], env);
          }) :
          (list_QUERY(ast) ?
            into_BANG("list", ast.map(function() {
              let ____args = Array.prototype.slice.call(arguments);
              return compute(____args[0], env);
            })) :
            (vector_QUERY(ast) ?
              into_BANG("vector", ast.map(function() {
                let ____args = Array.prototype.slice.call(arguments);
                return compute(____args[0], env);
              })) :
              ((false && map_QUERY(ast)) ?
                seq(ast).reduce(function(acc, en) {
                  acc[compute(en[0], env)] = compute(last(en), env);
                  return acc;
                }, {}) :
                (map_QUERY(ast) ?
                  (function() {
                    let m = {};
                    for (let i = 0, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
                      m[compute(ast[i], env)] = compute(ast[i + 1], env);
                    }
                    return m;
                  }).call(this) :
                  (true ?
                    ast :
                    null)))))))));
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleAND] in file: engine.ky near line: 428
const handleAND = function(ast, env) {
  let ret = true;
  for (let i = 1, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    ret = compute(ast[i], env);
    if ( (!ret) ) {
      ____break = true;
    }
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleOR] in file: engine.ky near line: 436
const handleOR = function(ast, env) {
  let ret = null;
  for (let i = 1, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    ret = compute(ast[i], env);
    if (ret) {
      ____break = true;
    }
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleLet] in file: engine.ky near line: 444
const handleLet = function(ast, env) {
  let e = new LEXEnv(env);
  let a1 = ast[1];
  for (let i = 0, sz = kirbystdlibref.count(a1), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
    e.set(a1[i], compute(a1[i + 1], e));
  }
  return [ast[2], e];
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleMacro] in file: engine.ky near line: 454
const handleMacro = function(ast, env) {
  let rc = [ast[0], ast[1], [symbol("fn*"), ast[2]].concat(ast.slice(3))];
  let a2 = rc[2];
  let a1 = rc[1];
  let func = compute(a2, env);
  func["____macro"] = true;
  return env.set(a1, func);
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleTry] in file: engine.ky near line: 466
const handleTry = function(ast, env) {
  let a1 = ast[1];
  let a2 = ast[2];
  return (function() {
    try {
      return compute(a1, env);
    } catch (ex) {
      return ((a2 && ("catch*" == a2[0])) ?
        ((ex instanceof Error) ?
          ex = ex.message :
          null) :
        compute(a2[2], new LEXEnv(env, [a2[1]], [ex])));
    }
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleIf] in file: engine.ky near line: 482
const handleIf = function(ast, env) {
  let c = compute(ast[1], env);
  let a2 = ast[2];
  let a3 = ast[3];
  return (((c === null) || (false === c)) ?
    ((!(typeof (a3) === "undefined")) ?
      a3 :
      null) :
    a2);
};
////////////////////////////////////////////////////////////////////////////////
//name: [handleForm] in file: engine.ky near line: 491
const handleForm = function(ast, env) {
  let f = null;
  let el = evalAst(ast, env);
  return ((vector_QUERY(ast) || map_QUERY(ast) || list_QUERY(ast)) ?
    [false, el] :
    (Array.isArray(el) ?
      (function() {
        f = el[0];
        return ((f && f.____ast) ?
          [true, f.____ast, f.____genenv(el.slice(1))] :
          (true ?
            [false,((typeof (f) === "function") ?
              f.apply(f, el.slice(1)) :
              el), env] :
            null));
      }).call(this) :
      (true ?
        [false, el] :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//name: [fn-wrap] in file: engine.ky near line: 510
const fn_DASH_wrap = function(run, ast, env, params) {
  let f = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return run(ast, new LEXEnv(env, params, ____args));
  };
  (f["____macro"] = false, f["____meta"] = null, f["____ast"] = ast, f["____genenv"] = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return new LEXEnv(env, params, ____args[0]);
  });
  return f;
};
////////////////////////////////////////////////////////////////////////////////
//name: [compute*] in file: engine.ky near line: 521
const compute_STAR = function(ast, env) {
  let ok_QUERY = true;
  let cmd = "";
  let ret = null;
  let g1 = function(a) {
    return (pairs_QUERY(a) ?
      a[0] :
      "");
  };
  for (let ____break = false; (!____break);) {
    (ast = mexpand(ast, env), cmd = g1(ast));
    ____break = ((!Array.isArray(ast)) ?
      (function() {
        let G__2 = true;
        ret = evalAst(ast, env);
        return G__2;
      }).call(this) :
      ((0 === kirbystdlibref.count(ast)) ?
        (function() {
          let G__3 = true;
          ret = ast;
          return G__3;
        }).call(this) :
        (("and*" == cmd) ?
          (function() {
            let G__4 = true;
            ret = handleAND(ast, env);
            return G__4;
          }).call(this) :
          (("or*" == cmd) ?
            (function() {
              let G__5 = true;
              ret = handleOR(ast, env);
              return G__5;
            }).call(this) :
            (("def*" == cmd) ?
              (function() {
                let G__6 = true;
                ret = env.set(a1, compute(a2, env));
                return G__6;
              }).call(this) :
              (("let*" == cmd) ?
                (function() {
                  let G__7 = false;
                  let rc = handleLet(ast, env);
                  (ast = rc[0], env = rc[1]);
                  return G__7;
                }).call(this) :
                (("quote" == cmd) ?
                  (function() {
                    let G__8 = true;
                    ret = ast[1];
                    return G__8;
                  }).call(this) :
                  (("quasiquote" == cmd) ?
                    (function() {
                      let G__9 = false;
                      ast = quasiquote(ast[1]);
                      return G__9;
                    }).call(this) :
                    (("macro*" == cmd) ?
                      (function() {
                        let G__10 = true;
                        ret = handleMacro(ast, env);
                        return G__10;
                      }).call(this) :
                      (("macroexpand" == cmd) ?
                        (function() {
                          let G__11 = true;
                          ret = mexpand(ast[1], env);
                          return G__11;
                        }).call(this) :
                        (("try*" == cmd) ?
                          (function() {
                            let G__12 = true;
                            ret = handleTry(ast, env);
                            return G__12;
                          }).call(this) :
                          (("do*" == cmd) ?
                            (function() {
                              let G__13 = false;
                              evalAst(ast.slice(1, -1), env);
                              ast = ast[(ast.length - 1)];
                              return G__13;
                            }).call(this) :
                            (("if*" == cmd) ?
                              (function() {
                                let G__14 = false;
                                ast = handleIf(ast, env);
                                return G__14;
                              }).call(this) :
                              (("fn*" == cmd) ?
                                (function() {
                                  let G__15 = true;
                                  ret = fn_DASH_wrap(compute, ast[2], env, ast[1]);
                                  return G__15;
                                }).call(this) :
                                (true ?
                                  (function() {
                                    let rc = handleForm(ast, env);
                                    let a1 = rc[1];
                                    let a2 = rc[2];
                                    return (rc[0] ?
                                      (function() {
                                        let G__16 = false;
                                        (ast = a1, env = a2);
                                        return G__16;
                                      }).call(this) :
                                      (function() {
                                        let G__17 = true;
                                        ret = a1;
                                        return G__17;
                                      }).call(this));
                                  }).call(this) :
                                  null)))))))))))))));
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//name: [compute] in file: engine.ky near line: 593
const compute = function(ast, env) {
  if ( (!env) ) {
    env = global_env;
  }
  let ret = compute_STAR(ast, env);
  return ((typeof (ret) === "undefined") ?
    null :
    ret);
};
////////////////////////////////////////////////////////////////////////////////
//name: [show] in file: engine.ky near line: 599
const show = function(exp) {
  return prn(exp);
};
////////////////////////////////////////////////////////////////////////////////
//name: [newEnv] in file: engine.ky near line: 602
const newEnv = function() {
  let ret = new LEXEnv();
  let G__18 = toolkit;
  Object.entries(G__18).forEach(function(e) {
    return (function(v, k) {
      return ret.set(symbol(k), v);
    })(e[1], e[0]);
  });
  ret.set(symbol("eval"), function() {
    let ____args = Array.prototype.slice.call(arguments);
    return compute(____args[0], ret);
  });
  ret.set(symbol("*ARGV*"), []);
  ret.set(symbol("*host-language*"), "javascript");
  ret.set(symbol("*gensym-counter*"), atom(0));
  return ret;
};
const prefix = "kirby> ";
////////////////////////////////////////////////////////////////////////////////
//name: [run_repl] in file: engine.ky near line: 617
const run_repl = function() {
  let rl = readline.createInterface(process.stdin, process.stdout);
  rl.on("line", function(line) {
    try {
      if (line) {
        if (console) {
          console.log([rep(line)].join(""));
        }
      }
    } catch (e) {
      if (console) {
        console.log([e].join(""));
      }
    }
    rl.setPrompt(prefix, prefix.length);
    return rl.prompt();
  });
  rl.on("close", function() {
    if (console) {
      console.log(["Bye!"].join(""));
    }
    return process.exit(0);
  });
  if (console) {
    console.log([prefix, "Kirby REPL v", version].join(""));
  }
  rl.setPrompt(prefix, prefix.length);
  return rl.prompt();
};
const rep = function() {
  let ____args = Array.prototype.slice.call(arguments);
  return show(compute(readAST(____args[0])));
};
var global_env = new LEXEnv();
////////////////////////////////////////////////////////////////////////////////
//name: [runRepl] in file: engine.ky near line: 644
const runRepl = function() {
  init();
  return run_repl();
};
const macro_assert = "\n  (macro* assert* [c msg] (if* c true (throw* msg))) ";
const macro_cond = "\n  (macro* cond* [&xs]\n    (if* (> (count* xs) 0)\n      (list* 'if*\n            (first* xs)\n            (nth* xs 1)\n            (cons* 'cond* (rest* (rest* xs)))))) ";
var inited_QUERY = false;
var version = "";
////////////////////////////////////////////////////////////////////////////////
//name: [init] in file: engine.ky near line: 662
const init = function(ver) {
  if ( (!inited_QUERY) ) {
    (version = ver, global_env = newEnv());
    rep(macro_cond);
    rep(macro_assert);
    loadMacros();
    inited_QUERY = true;
  }
  return inited_QUERY;
};
////////////////////////////////////////////////////////////////////////////////
//name: [globalEnv] in file: engine.ky near line: 672
const globalEnv = function() {
  return global_env;
};
module.exports = {
  LEXEnv: LEXEnv,
  setMacro: setMacro,
  getMacro: getMacro,
  expandMacro: expandMacro,
  compute: compute,
  newEnv: newEnv,
  runRepl: runRepl,
  init: init,
  globalEnv: globalEnv
};