/*Auto generated by Kirby v1.0.0 - Wed Jan 03 2018 00:29:38 GMT-0800 (PST)
  czlab.kirby.engine
({"doc":"","author":"Kenneth Leung"})
*/

const readline = require("readline");
const fs = require("fs");
const parser = require("./parser");
const std = require("./stdlib");
const pairs_QUERY = std["pairs_QUERY"];
const stringify = std["stringify"];
const contains_QUERY = std["contains_QUERY"];
const atom_QUERY = std["atom_QUERY"];
const list_QUERY = std["list_QUERY"];
const map_QUERY = std["map_QUERY"];
const some_QUERY = std["some_QUERY"];
const LambdaArg = std["LambdaArg"];
const Keyword = std["Keyword"];
const nichts_QUERY = std["nichts_QUERY"];
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
const typeid = std["typeid"];
const sequential_QUERY = std["sequential_QUERY"];
const conj_BANG = std["conj_BANG"];
const count = std["count"];
const truthy_QUERY = std["truthy_QUERY"];
const falsy_QUERY = std["falsy_QUERY"];
const last = std["last"];
const pop_BANG = std["pop_BANG"];
const opt_QUERY__QUERY = std["opt_QUERY__QUERY"];
const keyword_QUERY = std["keyword_QUERY"];
const symbol_QUERY = std["symbol_QUERY"];
const seq = std["seq"];
const kirbystdlibref = std;
const EXPKEY = "da57bc0172fb42438a11e6e8778f36fb";
const KBSTDLR = "kirbystdlibref";
const KBPFX = "czlab.kirby.";
const KBSTDLIB = [
  KBPFX,
  "stdlib"
].join("");
const macro_assert = "\n  (macro* assert* [c msg] `(if* ~c true (throw* ~msg))) ";
const macro_cond = "\n  (macro* cond* [&xs]\n    (if* (> (count* xs) 0)\n      (list* 'if*\n            (first* xs)\n            (nth* xs 1)\n            (cons* 'cond* (rest* (rest* xs)))))) ";
const macro_andp = "\n  (macro* _andp_* [&xs]\n    (if* (= 1 ~(count* xs)) `~(first* xs) `(and ~@xs))) ";
const GLOBAL = (((typeof (window) === "undefined")) ?
  undefined :
  window);
const STD_DASH_MACROS = "czlab.kirby.stdlib";
const prefix = "kirby> ";
////////////////////////////////////////////////////////////////////////////////
//fn: [expect!] in file: engine.ky,line: 58
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
  //fn: [constructor] in file: engine.ky,line: 66
  //Create and initialize
  //a new env with these symbols,
  //and optionally a parent env
  constructor(parent, vars, vals) {
    (this["nsp"] = null, this["parent"] = null, this["data"] = {}, this["libs"] = {}, this["vars"] = {});
    if (parent) {
      this["parent"] = parent;
    }
    for (let i = 0, e = null, ev = null, sz = kirbystdlibref.count(vars), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
      (e = vars[i], ev = e.value);
      if ( (ev === "&") ) {
        this.data[[
          vars[i + 1]
        ].join("")] = Array.prototype.slice.call(vals, i);
        ____break = true;
      } else {
        if (ev.startsWith("&")) {
          this.data[ev.slice(1)] = Array.prototype.slice.call(vals, i);
          ____break = true;
        } else {
          if (true) {
            this.data[ev] = vals[i];
          }
        }
      }
    }
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [find] in file: engine.ky,line: 86
  //Find the env
  //containing this symbol
  find(k) {
    expect_BANG(k);
    return (contains_QUERY(this.data, k.value) ?
      this :
      (some_QUERY(this.parent) ?
        this.parent.find(k) :
        null));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [set] in file: engine.ky,line: 93
  //Bind this symbol,
  //value to this env
  set(k, v) {
    expect_BANG(k);
    this.data[k.value] = v;
    return v;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [get] in file: engine.ky,line: 98
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
  //fn: [select] in file: engine.ky,line: 104
  select(what) {
    return seq(this.data).reduce(function(acc, GS__5) {
      let k = GS__5[0];
      let v = GS__5[1];
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
        acc[[
          k
        ].join("")] = v;
      }
      return acc;
    }, {});
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [prn] in file: engine.ky,line: 111
  //Print set of vars
  prn() {
    return std.prn(this.data);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [setNSP] in file: engine.ky,line: 114
  //Set current namespace
  setNSP(nsp) {
    let info = Array.prototype.slice.call(arguments, 1);
    return (function() {
      let GS__7 = null;
      this.nsp = {
        "id": [
          nsp
        ].join(""),
        "meta": info
      };
      return GS__7;
    }).call(this);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [curNSP] in file: engine.ky,line: 118
  //Returns the
  //current namespace
  curNSP() {
    return this.nsp;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [getLib] in file: engine.ky,line: 120
  getLib(alias) {
    return kirbystdlibref.getProp(this.libs, alias);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [addVar] in file: engine.ky,line: 121
  addVar(sym, info) {
    return (function() {
      let GS__8 = null;
      let s = [
        sym
      ].join("");
      let m = kirbystdlibref.getProp(this.vars, s);
      if (m) {
        throw new Error([
          "var: ",
          s,
          " already added"
        ].join(""));
      }
      this.vars[s] = info;
      return GS__8;
    }).call(this);
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [getVar] in file: engine.ky,line: 127
  getVar(sym) {
    return kirbystdlibref.getProp(this.vars, [
      sym
    ].join(""));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [hasVar?] in file: engine.ky,line: 129
  hasVar_QUERY(sym) {
    return contains_QUERY(this.vars, [
      sym
    ].join(""));
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [addLib] in file: engine.ky,line: 131
  addLib(alias, lib) {
    return (function() {
      let GS__9 = null;
      if (contains_QUERY(this.libs, alias)) {
        throw new Error([
          "Library alias already added: ",
          alias
        ].join(""));
      }
      this.libs[alias] = lib;
      return GS__9;
    }).call(this);
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [Function.prototype.clone] in file: engine.ky,line: 141
Function.prototype.clone = function() {
  let orig = this;
  let cloned = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return orig.apply(this, ____args);
  };
  let GS__10 = orig;
  Object.entries(GS__10).forEach(function(e) {
    return (function(v, k) {
      return cloned[k] = v;
    })(kirbystdlibref.getProp(e, 1), kirbystdlibref.getProp(e, 0));
  });
  return cloned;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [prnStr] in file: engine.ky,line: 149
const prnStr = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.map(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return prn(____args[0]);
  }).join(" ");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [prnLn] in file: engine.ky,line: 152
const prnLn = function() {
  let xs = Array.prototype.slice.call(arguments, 0);
  return xs.map(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return prn(____args[0]);
  }).forEach(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (console ?
      console.log([
        ____args[0]
      ].join("")) :
      null);
  });
};
////////////////////////////////////////////////////////////////////////////////
//fn: [slurp] in file: engine.ky,line: 155
const slurp = function(f) {
  return fs.readFileSync(f, "utf-8");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [spit] in file: engine.ky,line: 158
const spit = function(f, s) {
  fs.writeFileSync(f, s, "utf-8");
  return null;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [clone] in file: engine.ky,line: 161
const clone = function(obj) {
  let oid = typeid(obj);
  return (function() {
    let C__11;
    switch (oid) {
      case "vector":
      case "map":
      case "list":
        C__11 = into_BANG(oid, Array.prototype.slice.call(obj));
        break;
      case "array":
        C__11 = Array.prototype.slice.call(obj);
        break;
      case "object":
        C__11 = seq(obj).reduce(function(acc, GS__12) {
          let k = GS__12[0];
          let v = GS__12[1];
          acc[k] = v;
          return acc;
        }, {});
        break;
      case "function":
        C__11 = obj.clone();
        break;
      default:
        C__11 = (function() {
          throw new Error([
            "clone of non-collection: ",
            oid
          ].join(""));
        }).call(this);
        break;
    }
    return C__11;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [cons] in file: engine.ky,line: 178
const cons = function(a, b) {
  return [
    a
  ].concat(b);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [conj] in file: engine.ky,line: 181
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
//fn: [fapply] in file: engine.ky,line: 193
const fapply = function(f) {
  let xs = Array.prototype.slice.call(arguments, 1);
  return f.apply(this, xs);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [fmap] in file: engine.ky,line: 196
const fmap = function(f, arr) {
  return arr.map(f);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [resolveJS] in file: engine.ky,line: 199
const resolveJS = function(s) {
  return [
    (contains_QUERY(s, ".") ?
      eval(kirbystdlibref.getProp(/^(.*)\.[^\.]*$/g.exec(s), 1)) :
      GLOBAL),
    eval(s)
  ];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [filterJS] in file: engine.ky,line: 207
const filterJS = function(obj) {
  let s = stringify(obj);
  return (not_DASH_empty(s) ?
    JSON.parse(s) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [withMeta] in file: engine.ky,line: 212
const withMeta = function(obj, m) {
  let ret = clone(obj);
  ret["____meta"] = m;
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [meta] in file: engine.ky,line: 217
const meta = function(obj) {
  if ( (!((Array.isArray(obj)) || object_QUERY(obj) || ((typeof (obj) === "function")))) ) {
    throw new Error([
      "can't get meta from: ",
      typeid(obj)
    ].join(""));
  } else {
    null;
  }
  return kirbystdlibref.getProp(obj, "____meta");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [evalJS] in file: engine.ky,line: 225
const evalJS = function(s) {
  return filterJS(eval(s.toString()));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [invokeJS] in file: engine.ky,line: 229
const invokeJS = function(method) {
  let xs = Array.prototype.slice.call(arguments, 1);
  let GS__13 = resolveJS(method);
  let obj = GS__13[0];
  let f = GS__13[1];
  return filterJS(f.apply(obj, xs));
};
const _STAR_runtime_DASH_funcs_STAR = {
  "macroexpand*": function(code) {
    let GS__14 = Array.prototype.slice.call(arguments, 1);
    let env = GS__14[0];
    return (console ?
      console.log([
        std.prn(expand_QUERY__QUERY(code, (env || g_env)))
      ].join("")) :
      null);
  },
  "assert*": function(k, msg) {
    return ((!k) ?
      (function() {
        throw new Error(msg);
      }).call(this) :
      null);
  },
  "macros*": function() {
    let GS__15 = Array.prototype.slice.call(arguments, 0);
    let fout = GS__15[0];
    let s = std.prn(CACHE);
    return (fout ?
      spit(fout, s) :
      (console ?
        console.log([
          s
        ].join("")) :
        null));
  },
  "env*": function(what) {
    let GS__16 = Array.prototype.slice.call(arguments, 1);
    let env = GS__16[0];
    let fout = GS__16[1];
    let s = std.prn((env || g_env).select(what));
    return (fout ?
      spit(fout, s) :
      (console ?
        console.log([
          s
        ].join("")) :
        null));
  },
  "is-same?": function(a, b) {
    return (a == b);
  },
  "is-nil?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ((____args[0] === null));
  },
  "obj-type*": std.typeid,
  "gensym*": std.gensym,
  "is-eq?": std.eq_QUERY,
  "is-some?": std.some_QUERY,
  "str*": function() {
    let xs = Array.prototype.slice.call(arguments, 0);
    return xs.join("");
  },
  "slice*": function(arr) {
    let xs = Array.prototype.slice.call(arguments, 1);
    return Array.prototype.slice.apply(arr, xs);
  },
  "throw*": function() {
    let xs = Array.prototype.slice.call(arguments, 0);
    return (function() {
      throw new Error(xs.join(""));
    }).call(this);
  },
  "#f?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ((____args[0] === false));
  },
  "#t?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ((____args[0] === true));
  },
  "is-str?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ((typeof (____args[0]) === "string"));
  },
  "is-keyword?": std.keyword_QUERY,
  "is-symbol?": std.symbol_QUERY,
  "keyword*": std.keyword,
  "symbol*": std.symbol,
  "println*": prnLn,
  "prn*": prnStr,
  "slurp*": slurp,
  "spit*": spit,
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
  "/": function(a) {
    let xs = Array.prototype.slice.call(arguments, 1);
    return xs.reduce(function(acc, n) {
      return (acc / n);
    }, a);
  },
  "+": function() {
    let xs = Array.prototype.slice.call(arguments, 0);
    return xs.reduce(function(acc, n) {
      return (acc + n);
    }, 0);
  },
  "-": function(a) {
    let xs = Array.prototype.slice.call(arguments, 1);
    return xs.reduce(function(acc, n) {
      return (acc - n);
    }, a);
  },
  "*": function() {
    let xs = Array.prototype.slice.call(arguments, 0);
    return xs.reduce(function(acc, n) {
      return (acc * n);
    }, 1);
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
  "values*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return Object.values(____args[0]);
  },
  "keys*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return Object.keys(____args[0]);
  },
  "get*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return kirbystdlibref.getProp(____args[0], ____args[1]);
  },
  "not*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] ?
      false :
      true);
  },
  "dec*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] - 1);
  },
  "inc*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] + 1);
  },
  "is-even?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (0 === std.modulo(____args[0], 2));
  },
  "is-odd?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (1 === std.modulo(____args[0], 2));
  },
  "is-sequential?": std.sequential_QUERY,
  "concat*": std.concat_STAR,
  "count*": std.count,
  "cons*": cons,
  "rest*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (____args[0] ?
      Array.prototype.slice.call(____args[0], 1) :
      []);
  },
  "nth*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return kirbystdlibref.getProp(____args[0], ____args[1]);
  },
  "first*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return kirbystdlibref.getProp(____args[0], 0);
  },
  "is-empty?": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (0 === std.count(____args[0]));
  },
  "not-empty*": std.not_DASH_empty,
  "apply*": fapply,
  "map*": fmap,
  "evens*": std.evens,
  "odds*": std.odds,
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
  "js*": invokeJS,
  "type*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return typeof (____args[0]);
  }
};
var loadedMacros_QUERY = false;
const CACHE = {};
////////////////////////////////////////////////////////////////////////////////
//fn: [loadMacros] in file: engine.ky,line: 330
const loadMacros = function() {
  if ( (!loadedMacros_QUERY) ) {
    loadedMacros_QUERY = true;
    require("./macros.ky");
  }
  return loadedMacros_QUERY;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [setMacro] in file: engine.ky,line: 336
//Register a new macro
const setMacro = function(cmd, func) {
  return (function() {
    let GS__17 = null;
    if ( (cmd && ((typeof (func) === "function"))) ) {
      cmd = [
        cmd
      ].join("");
      if ( (!contains_QUERY(cmd, "/")) ) {
        let c = g_env.curNSP();
        if ( (!c) ) {
          throw new Error("missing namespace");
        } else {
          null;
        }
        cmd = [
          c.id,
          "/",
          cmd
        ].join("");
      }
      CACHE[cmd] = func;
    }
    return GS__17;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getMacro] in file: engine.ky,line: 350
//Get macro
const getMacro = function(cmd) {
  let skip,
    nsp,
    mname;
  cmd = [
    cmd
  ].join("");
  if (contains_QUERY(cmd, "/")) {
    let GS__18 = cmd.split("/");
    let p = GS__18[0];
    let c = GS__18[1];
    let tmp = null;
    let lib = genv().getLib(p);
    mname = c;
    if ( (KBSTDLR === p) ) {
      nsp = KBSTDLIB;
    } else {
      if (nichts_QUERY(lib)) {
        skip = true;
      } else {
        if (true) {
          if ( (!kirbystdlibref.getProp(lib, EXPKEY)) ) {
            skip = true;
          } else {
            nsp = kirbystdlibref.getProp(kirbystdlibref.getProp(lib, EXPKEY), "ns");
          }
        }
      }
    }
  } else {
    if (true) {
      let m = genv().getVar(cmd);
      (mname = cmd, nsp = (m ?
        kirbystdlibref.getProp(m, "ns") :
        KBSTDLIB));
    }
  }
  return ((!skip) ?
    kirbystdlibref.getProp(CACHE, [
      nsp,
      "/",
      mname
    ].join("")) :
    null);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dbg] in file: engine.ky,line: 376
const dbg = function(x) {
  return (function() {
    let GS__19 = null;
    if (console) {
      console.log([
        "DBG: ",
        prn(x)
      ].join(""));
    }
    return GS__19;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readAST] in file: engine.ky,line: 379
const readAST = function(s) {
  let ret = parser.parse(s);
  if ( (1 === kirbystdlibref.count(ret)) ) {
    ret = kirbystdlibref.getProp(ret, 0);
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [backtick] in file: engine.ky,line: 385
const backtick = function(ast) {
  let lst_QUERY = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (sequential_QUERY(____args[0]) && not_DASH_empty(____args[0]));
  };
  return ((!lst_QUERY(ast)) ?
    [
      kirbystdlibref.symbol("quote"),
      ast
    ] :
    ((symbol_QUERY(kirbystdlibref.getProp(ast, 0)) && (kirbystdlibref.getProp(ast, 0) == "unquote")) ?
      kirbystdlibref.getProp(ast, 1) :
      ((lst_QUERY(kirbystdlibref.getProp(ast, 0)) && symbol_QUERY(kirbystdlibref.getProp(kirbystdlibref.getProp(ast, 0), 0)) && (kirbystdlibref.getProp(kirbystdlibref.getProp(ast, 0), 0) == "splice-unquote")) ?
        [
          kirbystdlibref.symbol("concat*"),
          kirbystdlibref.getProp(kirbystdlibref.getProp(ast, 0), 1),
          backtick(ast.slice(1))
        ] :
        (true ?
          [
            kirbystdlibref.symbol("cons*"),
            backtick(kirbystdlibref.getProp(ast, 0)),
            backtick(ast.slice(1))
          ] :
          null))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [isMacroCall?] in file: engine.ky,line: 406
const isMacroCall_QUERY = function(ast, env) {
  return (pairs_QUERY(ast) && symbol_QUERY(kirbystdlibref.getProp(ast, 0)) && getMacro([
      kirbystdlibref.getProp(ast, 0)
    ].join("")));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [expand??] in file: engine.ky,line: 412
const expand_QUERY__QUERY = function(ast, env) {
  let cmd,
    mac;
  for (let ____break = false; ((!____break) && isMacroCall_QUERY(ast, env));) {
    (cmd = [
      kirbystdlibref.getProp(ast, 0)
    ].join(""), mac = getMacro(cmd), ast = mac.apply(this, ast.slice(1)));
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [eval*] in file: engine.ky,line: 420
const eval_STAR = function(ast, env) {
  return (((typeof (ast) === "string")) ?
    std.unquote_DASH_str(ast) :
    (keyword_QUERY(ast) ?
      ast.value :
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
                  null))))))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doAND] in file: engine.ky,line: 442
const doAND = function(ast, env) {
  let ret = true;
  for (let i = 1, sz = kirbystdlibref.count(ast), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
    ret = compute(ast[i], env);
    if ( (!ret) ) {
      ____break = true;
    } else {
      null;
    }
  }
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doOR] in file: engine.ky,line: 450
const doOR = function(ast, env) {
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
//fn: [doLET] in file: engine.ky,line: 458
const doLET = function(ast, env) {
  let e = new LEXEnv(env);
  let binds = kirbystdlibref.getProp(ast, 1);
  for (let i = 0, sz = kirbystdlibref.count(binds), ____break = false; ((!____break) && (i < sz)); i = (i + 2)) {
    e.set(binds[i], compute(binds[i + 1], e));
  }
  return [
    kirbystdlibref.getProp(ast, 2),
    e
  ];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doMACRO] in file: engine.ky,line: 469
const doMACRO = function(ast, env) {
  let name = [
    kirbystdlibref.getProp(ast, 1)
  ].join("");
  let nsp = g_env.curNSP();
  nsp = (nsp ?
    nsp.id :
    STD_DASH_MACROS);
  if ( (!contains_QUERY(name, "/")) ) {
    name = [
      nsp,
      "/",
      name
    ].join("");
  } else {
    null;
  }
  return (function() {
    let GS__20 = null;
    setMacro(name, fn_DASH__GT_raw(kirbystdlibref.getProp(ast, 2), ast[3], env));
    return GS__20;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doTRY] in file: engine.ky,line: 480
const doTRY = function(ast, env) {
  let a3 = kirbystdlibref.getProp(ast, 2);
  return (function() {
    try {
      return compute(kirbystdlibref.getProp(ast, 1), env);
    } catch (e) {
      return ((a3 && ("catch*" == kirbystdlibref.getProp(a3, 0))) ?
        (function() {
          if ( (e instanceof Error) ) {
            e = e.message;
          }
          return compute(kirbystdlibref.getProp(a3, 2), new LEXEnv(env, [
            kirbystdlibref.getProp(a3, 1)
          ], [
            e
          ]));
        }).call(this) :
        (function() {
          throw e;
        }).call(this));
    }
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doIF] in file: engine.ky,line: 495
const doIF = function(ast, env) {
  let kond = compute(ast[1], env);
  let a2 = ast[2];
  let a3 = ast[3];
  return (falsy_QUERY(kond) ?
    ((!((typeof (a3) === "undefined"))) ?
      a3 :
      null) :
    a2);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [form*] in file: engine.ky,line: 503
const form_STAR = function(ast, env) {
  let el = eval_STAR(ast, env);
  return ((vector_QUERY(ast) || map_QUERY(ast) || list_QUERY(ast)) ?
    atom(el) :
    ((Array.isArray(el)) ?
      (function() {
        let f = kirbystdlibref.getProp(el, 0);
        let c = (((typeof (f) === "function")) ?
          f.____code :
          null);
        return ((Array.isArray(c)) ?
          [
            kirbystdlibref.getProp(c, 1),
            new LEXEnv(kirbystdlibref.getProp(c, 2), kirbystdlibref.getProp(c, 0), el.slice(1))
          ] :
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
//fn: [fn->raw] in file: engine.ky,line: 521
//Wrap the function body and args inside
//a native js function
const fn_DASH__GT_raw = function(fargs, fbody, env) {
  return (function() {
    let GS__21 = function() {
      let ____args = Array.prototype.slice.call(arguments);
      return compute(fbody, new LEXEnv(env, fargs, ____args));
    };
    return GS__21;
  }).call(this);
};
const _STAR_spec_DASH_forms_STAR = {
  "def*": function(a, e) {
    return atom(e.set(a[1], compute(a[2], e)));
  },
  "and*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return atom(doAND(____args[0], ____args[1]));
  },
  "or*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return atom(doOR(____args[0], ____args[1]));
  },
  "let*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return doLET(____args[0], ____args[1]);
  },
  "quote": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return atom(kirbystdlibref.getProp(____args[0], 1));
  },
  "syntax-quote": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return [
      backtick(kirbystdlibref.getProp(____args[0], 1)),
      ____args[1]
    ];
  },
  "macro*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return atom(doMACRO(____args[0], ____args[1]));
  },
  "try*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return atom(doTRY(____args[0], ____args[1]));
  },
  "do*": function(a, e) {
    eval_STAR(a.slice(1, -1), e);
    return [
      kirbystdlibref.getProp(a, (a.length - 1)),
      e
    ];
  },
  "if*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return [
      doIF(____args[0], ____args[1]),
      ____args[1]
    ];
  },
  "lambda*": function() {
    let ____args = Array.prototype.slice.call(arguments);
    return atom(fn_DASH__GT_raw(____args[0][1], ____args[0][2], ____args[1]));
  }
};
////////////////////////////////////////////////////////////////////////////////
//fn: [compute] in file: engine.ky,line: 544
//Interpret a expression
const compute = function(expr, cenv) {
  let g1 = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (pairs_QUERY(____args[0]) ?
      kirbystdlibref.getProp(____args[0], 0) :
      "");
  };
  let env = (cenv || g_env);
  let ret = (function() {
    let _x_ = null;
    let recur = null;
    let _f_ = function(ast) {
      let cmd = [
        g1(ast)
      ].join("");
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
      return (atom_QUERY(res) ?
        res :
        (function() {
          env = kirbystdlibref.getProp(res, 1);
          return recur(expand_QUERY__QUERY(kirbystdlibref.getProp(res, 0), env));
        }).call(this));
    };
    let _r_ = _f_;
    recur = function() {
      _x_ = arguments;
      if (_r_) {
        for (_r_ = undefined; _r_ === undefined;) {
          _r_ = _f_.apply(this, _x_);
        }
        return _r_;
      }
      return undefined;
    };
    return recur(expand_QUERY__QUERY(expr, env));
  })(this);
  return (((typeof (ret.value) === "undefined")) ?
    null :
    ret.value);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [newEnv] in file: engine.ky,line: 567
//Create a new interpreter environment
const newEnv = function() {
  return (function() {
    let ret = new LEXEnv();
    let GS__22 = _STAR_runtime_DASH_funcs_STAR;
    Object.entries(GS__22).forEach(function(e) {
      return (function(v, k) {
        return ret.set(symbol(k), v);
      })(kirbystdlibref.getProp(e, 1), kirbystdlibref.getProp(e, 0));
    });
    return ret;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [runRepl] in file: engine.ky,line: 573
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
        if (console) {
          console.log([
            reval(line)
          ].join(""));
        }
      }
    } catch (e) {
      if (console) {
        console.log([
          e
        ].join(""));
      }
    }
    return pt();
  };
  let cl = function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (function() {
      if (console) {
        console.log([
          "Bye!"
        ].join(""));
      }
      return process.exit(0);
    }).call(this);
  };
  ss.on("close", cl);
  ss.on("line", rl);
  init();
  if (console) {
    console.log([
      prefix,
      "Kirby REPL v",
      _STAR_version_STAR
    ].join(""));
  }
  return pt();
};
////////////////////////////////////////////////////////////////////////////////
//fn: [reval] in file: engine.ky,line: 589
//Eval one or more expressions
const reval = function(expr) {
  let xs = Array.prototype.slice.call(arguments, 1);
  let f = function() {
    let ____args = Array.prototype.slice.call(arguments);
    let F__23 = readAST;
    let R__24 = F__23.apply(this, ____args);
    let F__25 = compute;
    let R__26 = F__25(R__24);
    let F__27 = prn;
    let R__28 = F__27(R__26);
    return R__28;
  };
  let ret = f(expr);
  let GS__29 = xs;
  for (let GS__31 = 0, GS__30 = false, ____break = false; ((!____break) && ((!GS__30) && (GS__31 < GS__29.length))); GS__31 = (GS__31 + 1)) {
    let e = kirbystdlibref.getProp(GS__29, GS__31);
    null;
    if ( (!true) ) {
      GS__30 = true;
    } else {
      null;
    }
    if ( ((!GS__30) && true) ) {
      ret = f(e);
    }
  }
  null;
  return ret;
};
var inited_QUERY = false;
var _STAR_version_STAR = "";
var g_env = null;
////////////////////////////////////////////////////////////////////////////////
//fn: [init] in file: engine.ky,line: 598
//Set up the runtime environment
const init = function(ver) {
  if ( (!inited_QUERY) ) {
    (_STAR_version_STAR = ver, g_env = newEnv());
    reval(macro_cond, macro_andp);
    inited_QUERY = true;
  }
  return inited_QUERY;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [genv] in file: engine.ky,line: 606
//Returns the runtime environment
const genv = function() {
  return g_env;
};
const ____macros = {
  "prnArr": "(macro* prnArr (arr) (syntax-quote (map (lambda (prn %1)) (unquote arr))))"
};
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.engine",
    macros: ____macros
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
  expand_QUERY__QUERY: expand_QUERY__QUERY,
  compute: compute,
  newEnv: newEnv,
  runRepl: runRepl,
  init: init,
  genv: genv
};