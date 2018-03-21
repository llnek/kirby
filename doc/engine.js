/*Auto generated by Kirby v1.0.0 - Tue Mar 20 2018 18:48:06 GMT-0700 (PDT)
  czlab.kirby.engine
{"doc" "" "author" "Kenneth Leung"}
*/

const readline = require("readline");
const fs = require("fs");
const reader = require("./reader");
const std = require("./stdlib");
const pairs_QMRK = std["pairs_QMRK"];
const stringify = std["stringify"];
const contains_QMRK = std["contains_QMRK"];
const atom_QMRK = std["atom_QMRK"];
const list_QMRK = std["list_QMRK"];
const map_QMRK = std["map_QMRK"];
const some_QMRK = std["some_QMRK"];
const LambdaArg = std["LambdaArg"];
const Keyword = std["Keyword"];
const println = std["println"];
const nichts_QMRK = std["nichts_QMRK"];
const not_DASH_empty = std["not_DASH_empty"];
const object_QMRK = std["object_QMRK"];
const Symbol = std["Symbol"];
const into_BANG = std["into_BANG"];
const prn = std["prn"];
const obj_QMRK = std["obj_QMRK"];
const set_QMRK = std["set_QMRK"];
const Atom = std["Atom"];
const symbol = std["symbol"];
const swap_BANG = std["swap_BANG"];
const atom = std["atom"];
const vector = std["vector"];
const vector_QMRK = std["vector_QMRK"];
const typeid = std["typeid"];
const sequential_QMRK = std["sequential_QMRK"];
const conj_BANG = std["conj_BANG"];
const count = std["count"];
const truthy_QMRK = std["truthy_QMRK"];
const falsy_QMRK = std["falsy_QMRK"];
const last = std["last"];
const pop_BANG = std["pop_BANG"];
const opt_QMRK__QMRK = std["opt_QMRK__QMRK"];
const keyword_QMRK = std["keyword_QMRK"];
const symbol_QMRK = std["symbol_QMRK"];
const seq = std["seq"];
const kirbystdlibref = std;
const __module_namespace__ = "czlab.kirby.engine";
const EXPKEY = "da57bc0172fb42438a11e6e8778f36fb";
const KBSTDLR = "kirbystdlibref";
const KBPFX = "czlab.kirby.";
const KBSTDLIB = [KBPFX, "stdlib"].join("");
const macro_assert = "\n  (macro* assert* [c msg] `(if* ~c true (throw* ~msg))) ";
const GLOBAL = (((typeof (window) === "undefined")) ?
  undefined :
  window);
const prefix = "kirby> ";
////////////////////////////////////////////////////////////////////////////////
//fn: [expect!] in file: engine.ky, line: 47
const expect_BANG = function(k) {
  return ((!(k instanceof Symbol)) ?
    (function() {
      throw new Error("expecting symbol");
    }).call(this) :
    null);
};
//Lexical Environment
class LEXEnv {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: engine.ky, line: 54
  //Create and initialize
  //a new env with these symbols,
  //and optionally a parent env
  constructor(parent, vars, vals) {
    (this["data"] = (new Map([])), this["libs"] = (new Map([])), this["vars"] = (new Map([])), this["par"] = null);
    if (parent) {
      (
      this["par"] = parent);
    }
    for (let i = 0, e = null, ev = null, sz = kirbystdlibref.count(vars), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
      (e = vars[i], ev = e.value);
      if ( (ev == "&") ) {
        (kirbystdlibref.assoc_BANG(this.data, [vars[i + 1]].join(""), Array.prototype.slice.call(vals, i)));
        (
        ____break = true);
      } else {
        if (ev.startsWith("&")) {
          (kirbystdlibref.assoc_BANG(this.data, ev.slice(1), Array.prototype.slice.call(vals, i)));
          (
          ____break = true);
        } else {
          if (true) {
            (kirbystdlibref.assoc_BANG(this.data, ev, vals[i]));
          }
        }
      }
    }
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [find] in file: engine.ky, line: 80
  //Find the env
  //containing this symbol
  find(k) {
    expect_BANG(k);
    return (contains_QMRK(this.data, k.value) ?
      this :
      (some_QMRK(this.par) ?
        this.par.find(k) :
        null));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [set] in file: engine.ky, line: 87
  //Bind this symbol,
  //value to this env
  set(k, v) {
    expect_BANG(k);
    (kirbystdlibref.assoc_BANG(this.data, k.value, v));
    return v;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [get] in file: engine.ky, line: 92
  //Get value of
  //this symbol
  get(k) {
    expect_BANG(k);
    let env = this.find(k);
    return (env ?
      kirbystdlibref.getProp(env.data, k.value) :
      k.value);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [select] in file: engine.ky, line: 98
  select(what) {
    return seq(this.data).reduce(function(acc, GS__5) {
      let k = kirbystdlibref.getIndex(GS__5, 0);
      let v = kirbystdlibref.getIndex(GS__5, 1);
      if ((function() {
          let C__6;
          switch (what) {
            case "fn":
              C__6 = ((typeof (v) === "function"));
              break;
            case "var":
              C__6 = (!((typeof (v) === "function")));
              break;
            default:
              C__6 = true;
              break;
          }
          return C__6;
        }).call(this)) {
        (kirbystdlibref.assoc_BANG(acc, [k].join(""), v));
      }
      return acc;
    }, (new Map([])));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [prn] in file: engine.ky, line: 105
  //Print set of vars
  prn() {
    return std.prn(this.data);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [getLib] in file: engine.ky, line: 109
  getLib(alias) {
    return (this.par ?
      this.par.getLib(alias) :
      kirbystdlibref.getProp(this.libs, alias));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [addVar] in file: engine.ky, line: 114
  addVar(sym, info) {
    return (this.par ?
      this.par.addVar(sym, info) :
      (function() {
        let s = [sym].join("");
        let m = kirbystdlibref.getProp(this.vars, s);
        if (m) {
          throw new Error(["var: ", s, " already added"].join(""));
        }
        (kirbystdlibref.assoc_BANG(this.vars, s, info));
        return null;
      }).call(this));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [getVar] in file: engine.ky, line: 122
  getVar(sym) {
    return (this.par ?
      this.par.getVar(sym) :
      kirbystdlibref.getProp(this.vars, [sym].join("")));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [hasVar?] in file: engine.ky, line: 127
  hasVar_QMRK(sym) {
    return (this.par ?
      this.par.hasVar_QMRK(sym) :
      contains_QMRK(this.vars, [sym].join("")));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [addLib] in file: engine.ky, line: 132
  addLib(alias, lib) {
    return (this.par ?
      this.par.addLib(alias, lib) :
      (function() {
        if (contains_QMRK(this.libs, alias)) {
          throw new Error(["Library alias already added: ", alias].join(""));
        }
        (kirbystdlibref.assoc_BANG(this.libs, alias, lib));
        return null;
      }).call(this));
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [Function.prototype.clone] in file: engine.ky, line: 145
Function.prototype.clone = function() {
  let orig = this;
  let cloned = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return orig.apply(this, ____args);
  };
  let GS__7 = orig;
  let GS__8 = function(v, k) {
    return (cloned[k] = v);
  };
  if (kirbystdlibref.object_QMRK(GS__7)) {
    let GS__9 = GS__7;
    Object.keys(GS__9).forEach(function(p) {
      return GS__8(kirbystdlibref.getProp(GS__9, p), p);
    });
  } else {
    GS__7.forEach(GS__8);
  }
  return cloned;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [prnStr] in file: engine.ky, line: 154
const prnStr = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.map(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return prn(____args[0]);
  }).join(" ");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [prnLn] in file: engine.ky, line: 157
const prnLn = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.map(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return prn(____args[0]);
  }).forEach(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return println(____args[0]);
  });
};
////////////////////////////////////////////////////////////////////////////////
//fn: [slurp] in file: engine.ky, line: 160
const slurp = function(f) {
  return fs.readFileSync(f, "utf-8");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [spit] in file: engine.ky, line: 163
const spit = function(f, s) {
  return (function() {
    fs.writeFileSync(f, s, "utf-8");
    return null;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [clone] in file: engine.ky, line: 166
const clone = function(obj) {
  let oid = typeid(obj);
  return (function() {
    let C__10;
    switch (oid) {
      case "vector":
      case "map":
      case "list":
        C__10 = into_BANG(oid, Array.prototype.slice.call(obj));
        break;
      case "array":
        C__10 = Array.prototype.slice.call(obj);
        break;
      case "object":
        C__10 = seq(obj).reduce(function(acc, GS__11) {
          let k = kirbystdlibref.getIndex(GS__11, 0);
          let v = kirbystdlibref.getIndex(GS__11, 1);
          (
          acc[k] = v);
          return acc;
        }, {});
        break;
      case "function":
        C__10 = obj.clone();
        break;
      default:
        C__10 = (function() {
          throw new Error(["clone of non-collection: ", oid].join(""));
        }).call(this);
        break;
    }
    return C__10;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [cons] in file: engine.ky, line: 183
const cons = function(a, b) {
  return [a].concat(b);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [conj] in file: engine.ky, line: 186
const conj = function(arr) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return (list_QMRK(arr) ?
    into_BANG("list", xs.reverse().concat(arr)) :
    (some_QMRK(arr) ?
      into_BANG("vector", arr.concat(xs)) :
      (true ?
        arr :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [fapply] in file: engine.ky, line: 198
const fapply = function(f) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return f.apply(this, xs);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [fmap] in file: engine.ky, line: 201
const fmap = function(f, arr) {
  return arr.map(f);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [resolveJS] in file: engine.ky, line: 204
const resolveJS = function(s) {
  return [(contains_QMRK(s, ".") ?
    eval(/^(.*)\.[^\.]*$/g.exec(s)[1]) :
    GLOBAL), eval(s)];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [filterJS] in file: engine.ky, line: 212
const filterJS = function(obj) {
  let s = stringify(obj);
  return (not_DASH_empty(s) ?
    JSON.parse(s) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [withMeta] in file: engine.ky, line: 217
const withMeta = function(obj, m) {
  let ret = clone(obj);
  (ret["____meta"] = m);
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [meta] in file: engine.ky, line: 222
const meta = function(obj) {
  if ( (!(((Object.prototype.toString.call(obj) === "[object Map]")) || ((Object.prototype.toString.call(obj) === "[object Set]")) || object_QMRK(obj) || (Array.isArray(obj)) || ((typeof (obj) === "function")))) ) {
    throw new Error(["can't get meta from: ", typeid(obj)].join(""));
  } else {
    null;
  }
  return kirbystdlibref.getProp(obj, "____meta");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [evalJS] in file: engine.ky, line: 232
const evalJS = function(s) {
  return filterJS(eval(s.toString()));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [invokeJS] in file: engine.ky, line: 236
const invokeJS = function(method) {
  let xs = Array.prototype.slice.call(arguments, 1);
  let GS__12 = resolveJS(method);
  let obj = kirbystdlibref.getIndex(GS__12, 0);
  let f = kirbystdlibref.getIndex(GS__12, 1);
  return filterJS(f.apply(obj, xs));
};
const _STAR_intrinsics_STAR = (new Map([["macroexpand*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return println(std.prn(expand_QMRK__QMRK(____args[0], (____args[1] || g_env))));
}], ["macros*", function() {
  let GS__13 = Array.prototype.slice.call(arguments, 0);
  let fout = kirbystdlibref.getIndex(GS__13, 0);
  let s = std.prn(CACHE);
  return (fout ?
    spit(fout, s) :
    println(s));
}], ["env*", function(what) {
  let GS__14 = Array.prototype.slice.call(arguments, 1);
  let env = kirbystdlibref.getIndex(GS__14, 0);
  let fout = kirbystdlibref.getIndex(GS__14, 1);
  let s = std.prn((env || g_env).select(what));
  return (fout ?
    spit(fout, s) :
    println(s));
}], ["is-same?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] == ____args[1]);
}], ["is-nil?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return ((____args[0] === null));
}], ["obj-type*", std.typeid], ["gensym*", std.gensym], ["is-eq?", std.eq_QMRK], ["is-some?", std.some_QMRK], ["str*", function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.join("");
}], ["slice*", function(arr) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return Array.prototype.slice.apply(arr, xs);
}], ["throw*", function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return (function() {
    throw new Error(xs.join(""));
  }).call(this);
}], ["#f?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return ((____args[0] === false));
}], ["#t?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return ((____args[0] === true));
}], ["is-str?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return ((typeof (____args[0]) === "string"));
}], ["is-keyword?", std.keyword_QMRK], ["is-symbol?", std.symbol_QMRK], ["keyword*", std.keyword], ["symbol*", std.symbol], ["println*", prnLn], ["prn*", prnStr], ["slurp*", slurp], ["spit*", spit], ["<", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] < ____args[1]);
}], ["<=", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] <= ____args[1]);
}], [">", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] > ____args[1]);
}], [">=", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] >= ____args[1]);
}], ["/", function(a) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return xs.reduce(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] / ____args[1]);
  }, a);
}], ["+", function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.reduce(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] + ____args[1]);
  }, 0);
}], ["-", function(a) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return xs.reduce(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] - ____args[1]);
  }, a);
}], ["*", function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.reduce(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] * ____args[1]);
  }, 1);
}], ["not=", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] !== ____args[1]);
}], ["=", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] === ____args[1]);
}], ["is-contains?", std.contains_QMRK], ["is-vector?", std.vector_QMRK], ["is-list?", std.list_QMRK], ["is-map?", std.map_QMRK], ["is-array?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return Array.isArray(____args[0]);
}], ["object*", std.object], ["vector*", std.vector], ["list*", std.list], ["hashmap*", function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return std.assoc_BANG.apply(this, [(new Map([]))].concat(xs));
}], ["values*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return Array.from(____args[0].values());
}], ["keys*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return Array.from(____args[0].keys());
}], ["get*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return kirbystdlibref.getProp(____args[0], ____args[1]);
}], ["not*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] ?
    false :
    true);
}], ["dec*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] - 1);
}], ["inc*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] + 1);
}], ["is-even?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (0 === std.modulo(____args[0], 2));
}], ["is-odd?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (1 === std.modulo(____args[0], 2));
}], ["is-sequential?", std.sequential_QMRK], ["concat*", std.concat_STAR], ["count*", std.count], ["cons*", cons], ["rest*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (____args[0] ?
    Array.prototype.slice.call(____args[0], 1) :
    []);
}], ["nth*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return kirbystdlibref.getProp(____args[0], ____args[1]);
}], ["first*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return kirbystdlibref.getProp(____args[0], 0);
}], ["is-empty?", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (0 === std.count(____args[0]));
}], ["not-empty*", std.not_DASH_empty], ["apply*", fapply], ["map*", fmap], ["evens*", std.evens], ["odds*", std.odds], ["meta*", meta], ["conj*", conj], ["seq*", std.seq], ["is-atom?", std.atom_QMRK], ["atom*", std.atom], ["deref*", std.deref], ["reset*", std.reset_BANG], ["swap*", std.swap_BANG], ["with-meta*", withMeta], ["js-eval*", evalJS], ["js*", invokeJS], ["type*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return typeof (____args[0]);
}]]));
const CACHE = (new Map([]));
////////////////////////////////////////////////////////////////////////////////
//fn: [setMacro] in file: engine.ky, line: 329
//Register a new macro
const setMacro = function(cmd, func) {
  return (function() {
    if ( (cmd && ((typeof (func) === "function"))) ) {
      (
      cmd = [cmd].join(""));
      if ( (!contains_QMRK(cmd, "/")) ) {
        let c = std.peekNSP();
        if ( (!c) ) {
          throw new Error("missing namespace");
        } else {
          null;
        }
        (cmd = [kirbystdlibref.getProp(c, "id"), "/", cmd].join(""));
      }
      (kirbystdlibref.assoc_BANG(CACHE, cmd, func));
    }
    return null;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getMacro] in file: engine.ky, line: 343
//Get macro
const getMacro = function(cmd) {
  let skip = undefined;
  let nsp = undefined;
  let mname = undefined;
  (cmd = [cmd].join(""));
  if (contains_QMRK(cmd, "/")) {
    let GS__15 = cmd.split("/");
    let p = kirbystdlibref.getIndex(GS__15, 0);
    let c = kirbystdlibref.getIndex(GS__15, 1);
    let tmp = null;
    let libObj = genv().getLib(p);
    (mname = c);
    if ( (p == KBSTDLR) ) {
      (
      nsp = KBSTDLIB);
    } else {
      if (nichts_QMRK(libObj)) {
        (
        skip = true);
      } else {
        if (true) {
          if ( (!kirbystdlibref.getProp(libObj, EXPKEY)) ) {
            (
            skip = true);
          } else {
            (
            nsp = kirbystdlibref.getProp(kirbystdlibref.getProp(libObj, EXPKEY), "ns"));
          }
        }
      }
    }
  } else {
    if (true) {
      let m = genv().getVar(cmd);
      (mname = cmd, nsp = (m ?
        kirbystdlibref.getProp(m, "ns") :
        null));
    }
  }
  return ((!skip) ?
    (function() {
      if (( (nsp === null) )) {
        if (kirbystdlibref.getProp(CACHE, [KBSTDLIB, "/", mname].join(""))) {
          (
          nsp = KBSTDLIB);
        }
      }
      return (((typeof (nsp) === "string")) ?
        (function() {
          return kirbystdlibref.getProp(CACHE, [nsp, "/", mname].join(""));
        }).call(this) :
        null);
    }).call(this) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dbg] in file: engine.ky, line: 370
const dbg = function(x) {
  return (function() {
    println("DBG: ", prn(x));
    return null;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readAST] in file: engine.ky, line: 373
const readAST = function(s) {
  let ret = reader.parse(s);
  if ( (1 === kirbystdlibref.count(ret)) ) {
    (
    ret = ret[0]);
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [backtick] in file: engine.ky, line: 379
const backtick = function(ast) {
  let lst_QMRK = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (sequential_QMRK(____args[0]) && not_DASH_empty(____args[0]));
  };
  return ((!lst_QMRK(ast)) ?
    [kirbystdlibref.symbol("quote"), ast] :
    ((symbol_QMRK(ast[0]) && (ast[0] == "unquote")) ?
      ast[1] :
      ((lst_QMRK(ast[0]) && symbol_QMRK(ast[0][0]) && (ast[0][0] == "splice-unquote")) ?
        [kirbystdlibref.symbol("concat*"), ast[0][1], backtick(ast.slice(1))] :
        (true ?
          [kirbystdlibref.symbol("cons*"), backtick(ast[0]), backtick(ast.slice(1))] :
          null))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [isMacroCall?] in file: engine.ky, line: 400
const isMacroCall_QMRK = function(ast, env) {
  return (pairs_QMRK(ast) && symbol_QMRK(ast[0]) && getMacro([ast[0]].join("")));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [expand??] in file: engine.ky, line: 404
const expand_QMRK__QMRK = function(ast, env) {
  let cmd = undefined;
  let mac = undefined;
  for (let ____break = false; ((!____break) && isMacroCall_QMRK(ast, env));) {
    (cmd = [ast[0]].join(""), mac = getMacro(cmd), ast = mac.apply(this, ast.slice(1)));
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [eval*] in file: engine.ky, line: 412
const eval_STAR = function(ast, env) {
  return (((typeof (ast) === "string")) ?
    std.unquote_DASH_str(ast) :
    (keyword_QMRK(ast) ?
      [ast].join("") :
      (symbol_QMRK(ast) ?
        env.get(ast) :
        (pairs_QMRK(ast) ?
          ast.map(function() {
            let ____args = Array.prototype.slice.call(arguments);
            return compute(____args[0], env);
          }) :
          (list_QMRK(ast) ?
            into_BANG("list", ast.map(function() {
              let ____args = Array.prototype.slice.call(arguments);
              return compute(____args[0], env);
            })) :
            (vector_QMRK(ast) ?
              into_BANG("vector", ast.map(function() {
                let ____args = Array.prototype.slice.call(arguments);
                return compute(____args[0], env);
              })) :
              (obj_QMRK(ast) ?
                (function() {
                  let m = {};
                  for (let i = 0, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
                    (kirbystdlibref.assoc_BANG(m, compute(ast[i], env), compute(ast[i + 1], env)));
                  }
                  return m;
                }).call(this) :
                (map_QMRK(ast) ?
                  (function() {
                    let m = (new Map([]));
                    for (let i = 0, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
                      (kirbystdlibref.assoc_BANG(m, compute(ast[i], env), compute(ast[i + 1], env)));
                    }
                    return m;
                  }).call(this) :
                  (set_QMRK(ast) ?
                    (function() {
                      let m = (new Set([]));
                      for (let i = 0, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
                        conj_BANG(m, compute(ast[i], env));
                      }
                      return m;
                    }).call(this) :
                    (true ?
                      ast :
                      null))))))))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doAND] in file: engine.ky, line: 446
const doAND = function(ast, env) {
  let ret = true;
  for (let i = 1, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    (
    ret = compute(ast[i], env));
    if ( (!ret) ) {
      (
      ____break = true);
    } else {
      null;
    }
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doOR] in file: engine.ky, line: 454
const doOR = function(ast, env) {
  let ret = null;
  for (let i = 1, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    (
    ret = compute(ast[i], env));
    if (ret) {
      (
      ____break = true);
    }
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doLET] in file: engine.ky, line: 462
const doLET = function(ast, env) {
  let e = new LEXEnv(env);
  let binds = ast[1];
  for (let i = 0, sz = kirbystdlibref.count(binds), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
    e.set(binds[i], compute(binds[i + 1], e));
  }
  return [ast[2], e];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doMACRO] in file: engine.ky, line: 473
const doMACRO = function(ast, env) {
  let name = [ast[1]].join("");
  let nsp = std.peekNSP();
  (nsp = (nsp ?
    kirbystdlibref.getProp(nsp, "id") :
    KBSTDLIB));
  if ( (!contains_QMRK(name, "/")) ) {
    (
    name = [nsp, "/", name].join(""));
  } else {
    null;
  }
  return (function() {
    setMacro(name, fn_DASH__GT_raw(ast[2], ast[3], env));
    return null;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doTRY] in file: engine.ky, line: 484
const doTRY = function(ast, env) {
  let a3 = ast[2];
  return (function() {
    try {
      return compute(ast[1], env);
    } catch (e) {
      return ((a3 && ("catch*" == a3[0])) ?
        (function() {
          if ( (e instanceof Error) ) {
            (
            e = e.message);
          }
          return compute(a3[2], new LEXEnv(env, [a3[1]], [e]));
        }).call(this) :
        (function() {
          throw e;
        }).call(this));
    }
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doIF] in file: engine.ky, line: 499
const doIF = function(ast, env) {
  let kond = compute(ast[1], env);
  let a2 = ast[2];
  let a3 = ast[3];
  return (falsy_QMRK(kond) ?
    ((!((typeof (a3) === "undefined"))) ?
      a3 :
      null) :
    a2);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [form*] in file: engine.ky, line: 507
const form_STAR = function(ast, env) {
  let el = eval_STAR(ast, env);
  return ((vector_QMRK(ast) || obj_QMRK(ast) || set_QMRK(ast) || map_QMRK(ast) || list_QMRK(ast)) ?
    atom(el) :
    ((Array.isArray(el)) ?
      (function() {
        let f = el[0];
        let c = (((typeof (f) === "function")) ?
          f.____code :
          null);
        return ((Array.isArray(c)) ?
          [c[1], new LEXEnv(c[2], c[0], el.slice(1))] :
          (((typeof (f) === "function")) ?
            atom(f.apply(this, el.slice(1))) :
            (true ?
              atom(el) :
              null)));
      }).call(this) :
      (true ?
        atom(el) :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [fn->raw] in file: engine.ky, line: 529
//Wrap the function body and args inside
//a native js function
const fn_DASH__GT_raw = function(fargs, fbody, env) {
  return (function() {
    let GS__16 = function() {
      let ____args = Array.prototype.slice.call(arguments);
      return compute(fbody, new LEXEnv(env, fargs, ____args));
    };
    return GS__16;
  }).call(this);
};
const _STAR_spec_DASH_forms_STAR = (new Map([["def*", function(a, e) {
  return atom(e.set(a[1], compute(a[2], e)));
}], ["and*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return atom(doAND(____args[0], ____args[1]));
}], ["or*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return atom(doOR(____args[0], ____args[1]));
}], ["let*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return doLET(____args[0], ____args[1]);
}], ["quote", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return atom(____args[0][1]);
}], ["syntax-quote", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [backtick(____args[0][1]), ____args[1]];
}], ["macro*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return atom(doMACRO(____args[0], ____args[1]));
}], ["try*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return atom(doTRY(____args[0], ____args[1]));
}], ["do*", function(a, e) {
  eval_STAR(a.slice(1, -1), e);
  return [a[(a.length - 1)], e];
}], ["if*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [doIF(____args[0], ____args[1]), ____args[1]];
}], ["lambda*", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return atom(fn_DASH__GT_raw(____args[0][1], ____args[0][2], ____args[1]));
}]]));
////////////////////////////////////////////////////////////////////////////////
//fn: [compute] in file: engine.ky, line: 553
//Interpret a expression
const compute = function(expr, cenv) {
  let g1 = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (pairs_QMRK(____args[0]) ?
      ____args[0][0] :
      "");
  };
  let env = (cenv || g_env);
  let ret = (function() {
    let _x_ = null;
    let recur = null;
    let _f_ = function(ast) {
      let cmd = [g1(ast)].join("");
      let fc = kirbystdlibref.getProp(_STAR_spec_DASH_forms_STAR, cmd);
      let res = ((!(Array.isArray(ast))) ?
        atom(eval_STAR(ast, env)) :
        ((0 === kirbystdlibref.count(ast)) ?
          atom(ast) :
          (((typeof (fc) === "function")) ?
            fc(ast, env) :
            (true ?
              form_STAR(ast, env) :
              null))));
      return (atom_QMRK(res) ?
        res :
        (function() {
          (
          env = res[1]);
          return recur(expand_QMRK__QMRK(res[0], env));
        }).call(this));
    };
    let _r_ = _f_;
    (recur = function() {
      (
      _x_ = arguments);
      if (_r_) {
        for (_r_ = undefined; _r_ === undefined;) {
          _r_ = _f_.apply(this, _x_);
        }
        return _r_;
      }
      return undefined;
    });
    return recur(expand_QMRK__QMRK(expr, env));
  })(this);
  return (((typeof (ret.value) === "undefined")) ?
    null :
    ret.value);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [newEnv] in file: engine.ky, line: 577
//Create a new interpreter environment
const newEnv = function() {
  return (function() {
    let ret = new LEXEnv();
    let GS__17 = _STAR_intrinsics_STAR;
    let GS__18 = function(v, k) {
      return ret.set(symbol(k), v);
    };
    if (kirbystdlibref.object_QMRK(GS__17)) {
      let GS__19 = GS__17;
      Object.keys(GS__19).forEach(function(p) {
        return GS__18(kirbystdlibref.getProp(GS__19, p), p);
      });
    } else {
      GS__17.forEach(GS__18);
    }
    return ret;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [runRepl] in file: engine.ky, line: 583
//Start a interactive session
const runRepl = function() {
  let ss = readline.createInterface(process.stdin, process.stdout);
  let z = prefix.length;
  let pt = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (function() {
      ss.setPrompt(prefix, z);
      return ss.prompt();
    }).call(this);
  };
  let rl = function(line) {
    try {
      if (line) {
        println(reval(line));
      }
    } catch (e) {
      println(e);
    }
    return pt();
  };
  let cl = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (function() {
      println("Bye!");
      return process.exit(0);
    }).call(this);
  };
  ss.on("close", cl);
  ss.on("line", rl);
  init();
  println(prefix, "Kirby REPL v", _STAR_version_STAR);
  return pt();
};
////////////////////////////////////////////////////////////////////////////////
//fn: [reval] in file: engine.ky, line: 600
//Eval one or more expressions
const reval = function(expr) {
  let xs = Array.prototype.slice.call(arguments, 1);
  let f = function() {
    let ____args = Array.prototype.slice.call(arguments);
    let F__20 = readAST;
    let R__21 = F__20.apply(this, ____args);
    let F__22 = compute;
    let R__23 = F__22(R__21);
    let F__24 = prn;
    let R__25 = F__24(R__23);
    return R__25;
  };
  let ret = f(expr);
  let GS__26 = xs;
  for (let GS__28 = 0, GS__27 = false, ____break = false; ((!____break) && ((!GS__27) && (GS__28 < GS__26.length))); GS__28 = (GS__28 + 1)) {
    let e = GS__26[GS__28];
    null;
    if ( (!true) ) {
      (
      GS__27 = true);
    } else {
      null;
    }
    if ( ((!GS__27) && true) ) {
      (
      ret = f(e));
    }
  }
  null;
  return ret;
};
var inited_QMRK = false;
var _STAR_version_STAR = "";
var g_env = null;
////////////////////////////////////////////////////////////////////////////////
//fn: [init] in file: engine.ky, line: 609
//Set up the runtime environment
const init = function(ver) {
  if ( (!inited_QMRK) ) {
    (_STAR_version_STAR = ver, g_env = newEnv());
    (
    inited_QMRK = true);
  }
  return inited_QMRK;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [genv] in file: engine.ky, line: 615
//Returns the runtime environment
const genv = function() {
  return g_env;
};
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.engine",
    macros: {}
  },
  EXPKEY: EXPKEY,
  KBSTDLR: KBSTDLR,
  KBPFX: KBPFX,
  KBSTDLIB: KBSTDLIB,
  LEXEnv: LEXEnv,
  slurp: slurp,
  spit: spit,
  setMacro: setMacro,
  getMacro: getMacro,
  readAST: readAST,
  expand_QMRK__QMRK: expand_QMRK__QMRK,
  compute: compute,
  newEnv: newEnv,
  runRepl: runRepl,
  init: init,
  genv: genv
};