/*Auto generated by Kirby v1.0.0 - Wed Jan 10 2018 00:20:18 GMT-0800 (PST)
  czlab.kirby.test.stdlib
({"doc":"","author":"Kenneth Leung"})
*/

const std = require("kirby");
const kirbystdlibref = std;
var s = std;
var TMPVAR = null;
////////////////////////////////////////////////////////////////////////////////
//fn: [mult3] in file: test.ky, line: 18
const mult3 = function(x) {
  return (3 * x);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [add2] in file: test.ky, line: 19
const add2 = function(x) {
  return (2 + x);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [exlog] in file: test.ky, line: 22
const exlog = function(expr, log) {
  return function(s) {
    let v = s.value;
    let v_QUOTE = expr(v);
    let msg = [log, "(", v, ")"].join("");
    let log_QUOTE = s.log.concat(msg);
    return [v_QUOTE, {
      "value": v_QUOTE,
      "log": log_QUOTE
    }];
  };
};
const test_DASH_stdlib = function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.ensureTest((!(0 === kirbystdlibref.count([1]))), "not empty?"), kirbystdlibref.ensureTest((0 === kirbystdlibref.count([])), "empty?"), kirbystdlibref.ensureTest("abc".startsWith("a"), "string starts?"), kirbystdlibref.ensureTest("abc".endsWith("c"), "string ends?"), kirbystdlibref.ensureTest((3 === kirbystdlibref.count([1, 2, 3])), "n#"), kirbystdlibref.ensureTest((1 === kirbystdlibref.getProp([1, 2], 0)), "1st"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp([1, 2], 1)), "2nd"), kirbystdlibref.ensureTest((3 === kirbystdlibref.getProp([1, 2, 3], 2)), "3rd"), kirbystdlibref.ensureTest((1 === kirbystdlibref.getProp(Array.prototype.slice.call([1, 2], 0, -1), 0)), "slice,a,b"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp(Array.prototype.slice.call([1, 2], 1), 0)), "slice,a"), kirbystdlibref.ensureTest((parseFloat("1.2") === 1.2), "float"), kirbystdlibref.ensureTest((parseInt("12") === 12), "int"), kirbystdlibref.ensureTest((function() {
    TMPVAR = undefined;
    return (undefined === TMPVAR);
  }).call(this), "undef!"), kirbystdlibref.ensureTest((function() {
    TMPVAR = null;
    return (null === TMPVAR);
  }).call(this), "nil!"), kirbystdlibref.ensureTest((2 === ([1, 2, 3].length - 1)), "last-index"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp([1, 2].slice(1), 0)), "rest"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp([1, 2].slice(1), 0)), "cdr"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp([1, 2], 1)), "second"), kirbystdlibref.ensureTest((1 === kirbystdlibref.getProp([1, 2], 0)), "first"), kirbystdlibref.ensureTest((1 === kirbystdlibref.getProp([1, 2], 0)), "car"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp([1, 2], (0 + 1))), "nexth"), kirbystdlibref.ensureTest((3 === kirbystdlibref.getProp([1, 2, 3], 2)), "nth"), kirbystdlibref.ensureTest((!((0 === kirbystdlibref.modulo(2, 2)) && (0 === kirbystdlibref.modulo(3, 2)))), "not even?"), kirbystdlibref.ensureTest(((0 === kirbystdlibref.modulo(2, 2))), "even? a"), kirbystdlibref.ensureTest(((0 === kirbystdlibref.modulo(2, 2)) && (0 === kirbystdlibref.modulo(4, 2))), "even? a,b"), kirbystdlibref.ensureTest((!((!((0 === kirbystdlibref.modulo(2, 2)))) && (!((0 === kirbystdlibref.modulo(3, 2)))))), "not odd?"), kirbystdlibref.ensureTest(((!((0 === kirbystdlibref.modulo(3, 2))))), "odd? a"), kirbystdlibref.ensureTest(((!((0 === kirbystdlibref.modulo(3, 2)))) && (!((0 === kirbystdlibref.modulo(9, 2))))), "odd? a,b"), kirbystdlibref.ensureTest((3 === [1, 2, 3].length), "alen"), kirbystdlibref.ensureTest(([1, 2].length > 0), "nzlen?"), kirbystdlibref.ensureTest((0 === [].length), "zlen?"), kirbystdlibref.ensureTest(("string" === typeof ("hello")), "type"), kirbystdlibref.ensureTest(("[object Array]" === Object.prototype.toString.call([3])), "whatis?"), kirbystdlibref.ensureTest(((Object.prototype.toString.call(/^hello/) === "[object RegExp]")), "regex?"), kirbystdlibref.ensureTest((Array.isArray([]) && Array.isArray([1]) && Array.isArray(["2"])), "array?"), kirbystdlibref.ensureTest((Array.isArray([]) && Array.isArray([1]) && Array.isArray(["2"])), "arr?"), kirbystdlibref.ensureTest(((Object.prototype.toString.call(new Date()) === "[object Date]")), "date?"), kirbystdlibref.ensureTest(((typeof (true) === "boolean") && (typeof (false) === "boolean")), "boolean?"), kirbystdlibref.ensureTest(((typeof (true) === "boolean") && (typeof (false) === "boolean")), "bool?"), kirbystdlibref.ensureTest(((typeof (4) === "number") && (typeof (8) === "number")), "number?"), kirbystdlibref.ensureTest(((typeof (4) === "number") && (typeof (8) === "number")), "num?"), kirbystdlibref.ensureTest(((typeof ("a") === "string") && (typeof ("b") === "string")), "string?"), kirbystdlibref.ensureTest(((typeof ("a") === "string") && (typeof ("b") === "string")), "str?"), kirbystdlibref.ensureTest(((typeof (function() {
      return null;
    }) === "function")), "fn?"), kirbystdlibref.ensureTest((function() {
    TMPVAR = undefined;
    return ((typeof (TMPVAR) === "undefined"));
  }).call(this), "undef?"), kirbystdlibref.ensureTest((function() {
    TMPVAR = 3;
    return ((typeof (TMPVAR) !== "undefined"));
  }).call(this), "def?"), kirbystdlibref.ensureTest(((null === null)), "nil?"), kirbystdlibref.ensureTest(((0 === 0)), "zero?"), kirbystdlibref.ensureTest(((1 === 1)), "one?"), kirbystdlibref.ensureTest(((-33 < 0)), "neg?"), kirbystdlibref.ensureTest(((45 > 0)), "pos?"), kirbystdlibref.ensureTest((1 === kirbystdlibref.getProp(Object.values({
      "a": 1
    }), 0)), "values"), kirbystdlibref.ensureTest(("a" === kirbystdlibref.getProp(Object.keys({
      "a": 1
    }), 0)), "keys"), kirbystdlibref.ensureTest(((1 === 1) ?
    true :
    (function() {
      throw new Error("error!");
    }).call(this)), "assert"), kirbystdlibref.ensureTest((((1 === 0) === false)), "false?"), kirbystdlibref.ensureTest((((0 === 0) === true)), "true?"), kirbystdlibref.ensureTest(("hello" === ((!false) ?
      (function() {
        return "hello";
      }).call(this) :
      null)), "when-not"), kirbystdlibref.ensureTest(("hello" === ((!false) ?
      (function() {
        return "hello";
      }).call(this) :
      null)), "unless"), kirbystdlibref.ensureTest(("hello" === ((!(1 === 0)) ?
      "hello" :
      null)), "if-not"), kirbystdlibref.ensureTest(("hello" === ((!(1 === 1)) ?
      "boom" :
      "hello")), "if-not->else"), kirbystdlibref.ensureTest((10 === (function() {
      TMPVAR = 0;
      for (let ____break = false; ((!____break) && (TMPVAR !== 10));) {
        ++TMPVAR;
      }
      return TMPVAR;
    }).call(this)), "while"), kirbystdlibref.ensureTest((101 === (true ?
      (function() {
        TMPVAR = 100;
        return ++TMPVAR;
      }).call(this) :
      null)), "when"), kirbystdlibref.ensureTest(("b" === ((1 === 2) ?
      "a" :
      ((2 === 2) ?
        "b" :
        null))), "cond"), kirbystdlibref.ensureTest(("b" === ((1 === 2) ?
      "a" :
      (true ?
        "b" :
        null))), "cond->else"), kirbystdlibref.ensureTest((36 === (((1 + 2) * 3) * 4)), "->"), kirbystdlibref.ensureTest((8 === (4 + (12 / (1 + 2)))), "->>"), kirbystdlibref.ensureTest((3 === (function() {
      let a = 1;
      let b = 2;
      return (a + b);
    }).call(this)), "let"), kirbystdlibref.ensureTest((1 === kirbystdlibref.count([1])), "single?"), kirbystdlibref.ensureTest((2 === kirbystdlibref.count([1, 2])), "dual?"), kirbystdlibref.ensureTest((3 === kirbystdlibref.count([1, 2, 3])), "triple?"), kirbystdlibref.ensureTest((911 === (function() {
      let _x_ = null;
      let recur = null;
      let _f_ = function(a, b) {
        return ((a === b) ?
          911 :
          recur((a + 1), (b - 1)));
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
      return recur(0, 10);
    })(this)), "loop"), kirbystdlibref.ensureTest((4 === [1, 2].concat([3, 4]).length), "concat"), kirbystdlibref.ensureTest(("a,b" === ["a", "b"].join(",")), "join"), kirbystdlibref.ensureTest((3 === (function() {
      let a = (1 + 2);
      (a / 3);
      return a;
    }).call(this)), "do-with"), kirbystdlibref.ensureTest((false === (function() {
      let GS__2 = false;
      (1 + 2);
      (1 === 1);
      return GS__2;
    }).call(this)), "do->false"), kirbystdlibref.ensureTest((true === (function() {
      let GS__3 = true;
      (1 + 2);
      (1 === 2);
      return GS__3;
    }).call(this)), "do->true"), kirbystdlibref.ensureTest((null === (function() {
      let GS__4 = null;
      (1 + 2);
      911;
      return GS__4;
    }).call(this)), "do->nil"), kirbystdlibref.ensureTest((undefined === (function() {
      let GS__5 = undefined;
      (1 + 2);
      911;
      return GS__5;
    }).call(this)), "do->undef"), kirbystdlibref.ensureTest((4 === (3 + 1)), "inc"), kirbystdlibref.ensureTest((2 === (3 - 1)), "dec"), kirbystdlibref.ensureTest((45 === (function() {
      let outer = 0;
      for (let x = 0, GS__6 = 10, ____break = false; ((!____break) && (x < GS__6)); x = (x + 1)) {
        outer += x;
      }
      return outer;
    }).call(this)), "dotimes"), kirbystdlibref.ensureTest((12 === kirbystdlibref.count((function() {
      let ret = [];
      for (let i = 0, ____break = false; ((!____break) && (i < 12)); i = (i + 1)) {
        ret.push(i);
      }
      return ret;
    }).call(this))), "range,a"), kirbystdlibref.ensureTest((2 === kirbystdlibref.count((function() {
      let ret = [];
      for (let i = 10, ____break = false; ((!____break) && (i < 12)); i = (i + 1)) {
        ret.push(i);
      }
      return ret;
    }).call(this))), "range,a,b"), kirbystdlibref.ensureTest((4 === kirbystdlibref.count((function() {
      let ret = [];
      for (let i = 5, ____break = false; ((!____break) && (i < 12)); i = (i + 2)) {
        ret.push(i);
      }
      return ret;
    }).call(this))), "range,a,b,c"), kirbystdlibref.ensureTest((function() {
    TMPVAR = (function() {
      let f = function(a, b) {
        return [b, a];
      };
      return f.apply(this, [1, 2]);
    }).call(this);
    return ((2 === kirbystdlibref.getProp(TMPVAR, 0)) && (1 === std.last(TMPVAR)));
  }).call(this), "apply"), kirbystdlibref.ensureTest((function() {
    TMPVAR = (function() {
      let f = function(a, b) {
        return [b, a];
      };
      return f.apply(this, [1, 2]);
    }).call(this);
    return ((2 === kirbystdlibref.getProp(TMPVAR, 0)) && (1 === std.last(TMPVAR)));
  }).call(this), "apply*"), kirbystdlibref.ensureTest(("z" === "hellz".charAt(4)), "ch@"), kirbystdlibref.ensureTest((false === (function() {
      TMPVAR = false;
      return TMPVAR;
    }).call(this)), "false!"), kirbystdlibref.ensureTest((true === (function() {
      TMPVAR = true;
      return TMPVAR;
    }).call(this)), "true!"), kirbystdlibref.ensureTest((function() {
    let x = (function() {
      let ret = [];
      for (let i = 0, ____break = false; ((!____break) && (i < 5)); i = (i + 1)) {
        ret.push("a");
      }
      return ret;
    }).call(this);
    return ((5 === kirbystdlibref.count(x)) && ("a" === std.last(x)));
  }).call(this), "repeat"), kirbystdlibref.ensureTest((28 === (function() {
      TMPVAR = 0;
      let GS__7 = (function() {
        let ret = [];
        for (let i = 0, ____break = false; ((!____break) && (i < 10)); i = (i + 1)) {
          ret.push(i);
        }
        return ret;
      }).call(this);
      for (let GS__9 = 0, GS__8 = false, ____break = false; ((!____break) && ((!GS__8) && (GS__9 < GS__7.length))); GS__9 = (GS__9 + 1)) {
        let x = kirbystdlibref.getProp(GS__7, GS__9);
        let y = (x + 1);
        let z = y;
        if ( (!(x < 7)) ) {
          GS__8 = true;
        } else {
          null;
        }
        if ( ((!GS__8) && true) ) {
          TMPVAR += z;
        }
      }
      null;
      return TMPVAR;
    }).call(this)), "doseq"), kirbystdlibref.ensureTest(("hello!" === (function() {
      let GS__10 = "hello".slice(0);
      let s = GS__10;
      return ((kirbystdlibref.count(GS__10) > 0) ?
        [s, "!"].join("") :
        null);
    }).call(this)), "if-some+"), kirbystdlibref.ensureTest(("ab" === (function() {
      let GS__11 = "hello".slice(5);
      let s = GS__11;
      return ((kirbystdlibref.count(GS__11) > 0) ?
        [s, "!"].join("") :
        ["ab"].join(""));
    }).call(this)), "if-some+->else"), kirbystdlibref.ensureTest((10 === (function() {
      let GS__12 = (1 + 2);
      let a = GS__12;
      return ((((typeof (GS__12) === "undefined")) || ((GS__12 === null))) ?
        null :
        (a + 7));
    }).call(this)), "if-some"), kirbystdlibref.ensureTest((17 === (function() {
      let GS__13 = null;
      let a = GS__13;
      return ((((typeof (GS__13) === "undefined")) || ((GS__13 === null))) ?
        (7 + 10) :
        (a + a));
    }).call(this)), "if-some->else"), kirbystdlibref.ensureTest((7 === (function() {
      let GS__14 = (1 === 1);
      let a = GS__14;
      return (GS__14 ?
        (3 + 4) :
        null);
    }).call(this)), "if-let"), kirbystdlibref.ensureTest((15 === (function() {
      let GS__15 = (1 === 2);
      let a = GS__15;
      return (GS__15 ?
        (3 + 4) :
        (7 + 8));
    }).call(this)), "if-let->else"), kirbystdlibref.ensureTest(("hello" === (function() {
      let GS__16 = "hello".slice(2);
      let s = GS__16;
      return ((kirbystdlibref.count(GS__16) > 0) ?
        (function() {
          kirbystdlibref.count(s);
          return ["he", s].join("");
        }).call(this) :
        null);
    }).call(this)), "when-some+"), kirbystdlibref.ensureTest(("hehello" === (function() {
      let GS__17 = "hello";
      let s = GS__17;
      return ((!(((typeof (GS__17) === "undefined")) || ((GS__17 === null)))) ?
        (function() {
          kirbystdlibref.count(s);
          return ["he", s].join("");
        }).call(this) :
        null);
    }).call(this)), "when-some"), kirbystdlibref.ensureTest((7 === (function() {
      let GS__18 = (1 === 1);
      let a = GS__18;
      return (GS__18 ?
        (function() {
          (2 + 2);
          return (3 + 4);
        }).call(this) :
        null);
    }).call(this)), "when-let"), kirbystdlibref.ensureTest((2 === kirbystdlibref.count((function() {
      let GS__19 = [];
      std.conj_BANG(GS__19, 1);
      std.conj_BANG(GS__19, 2);
      return GS__19;
    }).call(this))), "doto"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp([1, 2].map(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return (____args[0] + 1);
    }), 0)), "map"), kirbystdlibref.ensureTest((2 === kirbystdlibref.count([1, 2, 8].filter(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return ((0 === kirbystdlibref.modulo(____args[0], 2)));
    }))), "filter"), kirbystdlibref.ensureTest((true === [1, 2, 8].some(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return ((!((0 === kirbystdlibref.modulo(____args[0], 2)))));
    })), "some"), kirbystdlibref.ensureTest((function() {
    let x = Array.prototype.slice.call([1, 2, 3, 4, 5], 0, 3);
    return ((3 === kirbystdlibref.count(x)) && (3 === std.last(x)));
  }).call(this), "take"), kirbystdlibref.ensureTest((21 === (function() {
      let f = function() {
        let xs = Array.prototype.slice.call(arguments, 0);
        return 21;
      };
      return f(1, 4, 5);
    }).call(this)), "constantly"), kirbystdlibref.ensureTest((function() {
    let x = Array.prototype.slice.call([1, 2, 3, 4, 5], 3);
    return ((2 === kirbystdlibref.count(x)) && (5 === std.last(x)));
  }).call(this), "drop"), kirbystdlibref.ensureTest((21 === [5, 7, 9].reduce(function(acc, x) {
      return (acc + x);
    })), "reduce2"), kirbystdlibref.ensureTest((31 === [5, 7, 9].reduce(function(acc, x) {
      return (acc + x);
    }, 10)), "reduce"), kirbystdlibref.ensureTest(("ab" === ["a", "b"].join("")), "str"), kirbystdlibref.ensureTest((20 === (function() {
      let f = function() {
        let ____args = Array.prototype.slice.call(arguments);
        return (____args[0] + 7);
      };
      return f(13);
    }).call(this)), "lambda"), kirbystdlibref.ensureTest((6 === (function() {
      TMPVAR = 0;
      [1, 2, 3].forEach(function() {
        let ____args = Array.prototype.slice.call(arguments);
        return TMPVAR += ____args[0];
      });
      return TMPVAR;
    }).call(this)), "each"), kirbystdlibref.ensureTest((6 === (function() {
      TMPVAR = 0;
      let GS__20 = {
        "a": 1,
        "b": 2,
        "c": 3
      };
      Object.entries(GS__20).forEach(function(e) {
        return (function() {
          let ____args = Array.prototype.slice.call(arguments);
          return TMPVAR += ____args[0];
        })(kirbystdlibref.getProp(e, 1), kirbystdlibref.getProp(e, 0));
      });
      return TMPVAR;
    }).call(this)), "each-key"), kirbystdlibref.ensureTest(s.not_DASH_empty([2]), "not-empty"), kirbystdlibref.ensureTest((2 === s.opt_QUERY__QUERY(undefined, 2)), "opt??"), kirbystdlibref.ensureTest((function() {
    let a = [1];
    let b = s.conj(a, 2, 3);
    return ((1 === kirbystdlibref.count(a)) && (3 === kirbystdlibref.count(b)) && (3 === s.last(b)));
  }).call(this), "conj"), kirbystdlibref.ensureTest((function() {
    let c = [9, 8, 7];
    let GS__21 = s.pop_BANG(c);
    let a = GS__21[0];
    let b = GS__21[1];
    return ((7 === a) && (2 === kirbystdlibref.count(c)));
  }).call(this), "pop!"), kirbystdlibref.ensureTest((function() {
    let c = [9, 8, 7];
    let GS__22 = s.pop(c);
    let a = GS__22[0];
    let b = GS__22[1];
    return ((7 === a) && (3 === kirbystdlibref.count(c)));
  }).call(this), "pop"), kirbystdlibref.ensureTest(("xaaaz" === s.wrap_DASH_str("aaa", "x", "z")), "wrap-str"), kirbystdlibref.ensureTest(((typeof (s.getProp({
      "a": 1,
      "z": 5
    }, "x")) === "undefined")), "getProp,false"), kirbystdlibref.ensureTest((5 === s.getProp({
      "a": 1,
      "z": 5
    }, "z")), "getProp,true"), kirbystdlibref.ensureTest(((typeof (s.getProp({
      "a": 1,
      "z": 5
    }, "toString", false)) === "function")), "getProp,false"), kirbystdlibref.ensureTest(("(1 2 3)" === s.prn([1, 2, 3])), "prn"), kirbystdlibref.ensureTest((function() {
    let p = s.primitive(2);
    let v = p.value;
    return (s.primitive_QUERY(p) && (v === 2));
  }).call(this), "primitive,primitive?"), kirbystdlibref.ensureTest((function() {
    let a = s.lambda_DASH_arg("%9");
    let v = a.value;
    return (s.lambda_DASH_arg_QUERY(a) && (v === "8"));
  }).call(this), "lambda-arg,lambda-arg?"), kirbystdlibref.ensureTest((function() {
    let a = s.lambda_DASH_arg("%");
    let v = a.value;
    return (s.lambda_DASH_arg_QUERY(a) && (v === "0"));
  }).call(this), "lambda-arg,%,lambda-arg?"), kirbystdlibref.ensureTest((function() {
    let k = s.keyword(":hello");
    let v = k.value;
    return (s.keyword_QUERY(k) && (v === "hello"));
  }).call(this), "keyword,keyword?"), kirbystdlibref.ensureTest((function() {
    let s = std.symbol("hello");
    let v = s.value;
    return (std.symbol_QUERY(s) && (v === "hello"));
  }).call(this), "symbol,symbol?"), kirbystdlibref.ensureTest((function() {
    let a = s.atom("hello");
    let w = a.value;
    let v = a.value;
    return (s.atom_QUERY(a) && (w === v) && (v === "hello"));
  }).call(this), "atom,atom?,deref"), kirbystdlibref.ensureTest(s.symbol_QUERY(s.keyword_DASH__GT_symbol(s.keyword(":pooh"))), "keyword->symbol"), kirbystdlibref.ensureTest((8 === (function() {
      let a = s.atom(3);
      s.reset_BANG(a, 8);
      return a.value;
    }).call(this)), "reset!"), kirbystdlibref.ensureTest((8 === (function() {
      let a = s.atom(3);
      s.swap_BANG(a, function(old, more) {
        return (old + more);
      }, 5);
      return a.value;
    }).call(this)), "swap!"), kirbystdlibref.ensureTest(("atom" === s.typeid(s.atom(2))), "typeid"), kirbystdlibref.ensureTest((s.complex_QUERY([1]) && s.complex_QUERY({
      "a": 1
    })), "complex?"), kirbystdlibref.ensureTest((((s.complex_QUERY(2) === false)) && ((s.complex_QUERY("a") === false))), "not complex?"), kirbystdlibref.ensureTest((s.simple_QUERY(1) && s.simple_QUERY(null)), "simple?"), kirbystdlibref.ensureTest((((s.simple_QUERY([]) === false)) && ((s.simple_QUERY({}) === false))), "not simple?"), kirbystdlibref.ensureTest((s.value_QUERY(3) && (!s.value_QUERY(function() {
      return null;
    }))), "value?"), kirbystdlibref.ensureTest(s.sequential_QUERY([1, 2, 3]), "sequential?"), kirbystdlibref.ensureTest(s.eq_QUERY([1, 2], [1, 2]), "eq? -> array"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": 1,
    "b": 2
  }, {
    "b": 2,
    "a": 1
  }), "eq? -> object"), kirbystdlibref.ensureTest((!s.object_QUERY(1)), "not object?"), kirbystdlibref.ensureTest(s.object_QUERY({
    "a": 1
  }), "object?"), kirbystdlibref.ensureTest((3 === s.last([1, 2, 3])), "last"), kirbystdlibref.ensureTest(s.list_QUERY(s.into_BANG("list", [1, 2, 3])), "into!"), kirbystdlibref.ensureTest((function() {
    let x = s.list(1, 2, 3);
    let y = s.into("list", x);
    s.conj_BANG(x, 4);
    return ((4 === kirbystdlibref.count(x)) && (3 === kirbystdlibref.count(y)) && s.list_QUERY(y));
  }).call(this), "into"), kirbystdlibref.ensureTest(s.pairs_QUERY([1, 2, 3]), null), kirbystdlibref.ensureTest(s.list_QUERY(s.list(1, 2, 3)), "list,list?"), kirbystdlibref.ensureTest(s.vector_QUERY(s.vector(1, 2, 3)), "vector,vector?"), kirbystdlibref.ensureTest(s.map_QUERY(s.hashmap("a", 1, "b", 2, "c", 3)), "hashmap,map?"), kirbystdlibref.ensureTest((3 === kirbystdlibref.count(s.seq("abc"))), "seq"), kirbystdlibref.ensureTest(s.contains_QUERY([1, 2, 3], 2), "contains?"), kirbystdlibref.ensureTest((s.nichts_QUERY(null) && s.nichts_QUERY(undefined)), "nichts?"), kirbystdlibref.ensureTest(s.some_QUERY(false), "some?"), kirbystdlibref.ensureTest((3 === s.count([1, 2, 3])), "count"), kirbystdlibref.ensureTest((4 === kirbystdlibref.count(s.concat_STAR([1, 2], 3, 4))), "concat*"), kirbystdlibref.ensureTest((3 === s.last(s.evens([1, 2, 3, 4]))), "evens"), kirbystdlibref.ensureTest((4 === s.last(s.odds([1, 2, 3, 4]))), "odds"), kirbystdlibref.ensureTest(((1 === s.modulo(10, 3)) && (2 === s.modulo(-10, 3))), "modulo"), kirbystdlibref.ensureTest(s.eq_QUERY([1, 5, 2, 6], s.interleave([1, 2, 3], [5, 6])), "interleave"), kirbystdlibref.ensureTest(s.eq_QUERY([5, 1, 6, 2], s.interleave([5, 6], [1, 2, 3])), "interleave"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": 1,
    "b": 2
  }, s.zipmap(["a", "b"], [1, 2, 3])), "zipmap"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": 5,
    "b": 6
  }, s.zipmap(["a", "b", "c"], [5, 6])), "zipmap"), kirbystdlibref.ensureTest((function() {
    let g = s.gensym("X");
    return (s.symbol_QUERY(g) && g.value.startsWith("X"));
  }).call(this), "gensym"), kirbystdlibref.ensureTest((1 === kirbystdlibref.getProp(s.carve([1, 2], 0, -1), 0)), "carve,a,b"), kirbystdlibref.ensureTest((2 === kirbystdlibref.getProp(s.carve([1, 2], 1), 0)), "carve,a"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": 1,
    "b": 2
  }, s.assoc_BANG({}, "a", 1, "b", 2)), "assoc!"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "c": 3
  }, s.dissoc_BANG({
    "a": 1,
    "b": 2,
    "c": 3
  }, "a", "b")), "dissoc!"), kirbystdlibref.ensureTest((s.falsy_QUERY(false) && s.falsy_QUERY(null)), "falsy?"), kirbystdlibref.ensureTest(((!s.truthy_QUERY(null)) && (!s.truthy_QUERY(false))), "truthy?"), kirbystdlibref.ensureTest((function() {
    let x = s.quote_DASH_str("abc");
    return (x.startsWith("\"") && x.endsWith("\""));
  }).call(this), "quote-str"), kirbystdlibref.ensureTest(("abc" === s.unquote_DASH_str("\"abc\"")), "unquote-str"), kirbystdlibref.ensureTest(("&lt;&gt;&amp;&quot;&apos;" === s.escXml("<>&\"'")), "escXml"), kirbystdlibref.ensureTest((function() {
    let GS__23 = s.split_DASH_seq([1, 2, 3, 4, 5], 3);
    let x = GS__23[0];
    let y = GS__23[1];
    return (s.eq_QUERY([1, 2, 3], x) && s.eq_QUERY([4, 5], y));
  }).call(this), "split-seq"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": 1,
    "c": 3
  }, s.select_DASH_keys({
    "a": 1,
    "b": 2,
    "c": 3
  }, ["a", "c"])), "select-keys"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": {
      "b": {
        "c": 9
      }
    }
  }, s.update_DASH_in_BANG({
    "a": {
      "b": {
        "c": 4
      }
    }
  }, ["a", "b", "c"], function(old, n) {
    return (old + n);
  }, 5)), "update-in"), kirbystdlibref.ensureTest(s.eq_QUERY({
    "a": 1,
    "b": 2
  }, s.merge({
    "a": 1
  }, {
    "b": 2
  })), "merge"), kirbystdlibref.ensureTest(s.eq_QUERY([1, 2, 4], s.difference([1, 2, 3, 4, 5], [3, 5])), "difference"), kirbystdlibref.ensureTest((50 === s.percent(20, 40)), "percent"), kirbystdlibref.ensureTest(("3.333" === s.toFixed((10 / 3), 3)), "toFixed"), kirbystdlibref.ensureTest(s.eq_QUERY([4, 5], (function() {
    let ret = [],
      ____args = Array.prototype.slice.call(arguments);
    let F__24 = function(a) {
      return (1 + a);
    };
    ret.push(F__24.apply(this, ____args));
    let F__25 = function(b) {
      return (2 + b);
    };
    ret.push(F__25.apply(this, ____args));
    return ret;
  })(3)), "juxt"), kirbystdlibref.ensureTest((14 === (function() {
      let ____args = Array.prototype.slice.call(arguments);
      let F__26 = function(b, c) {
        return (b + c);
      };
      let R__27 = F__26.apply(this, ____args);
      let F__28 = function(a) {
        return (1 + a);
      };
      let R__29 = F__28(R__27);
      return R__29;
    })(3, 10)), "comp"), kirbystdlibref.ensureTest(s.eq_QUERY([1, 2, "3"], [1, 2, "3"]), "quote"), kirbystdlibref.ensureTest((3 === (function(mo) {
      let bind = mo["bind"];
      let unit = mo["unit"];
      let zero = mo["zero"];
      let ret = function() {
        let ____args = Array.prototype.slice.call(arguments);
        return ((kirbystdlibref.nichts_QUERY(____args[0]) && ((typeof (zero) !== "undefined"))) ?
          zero :
          unit(____args[0]));
      };
      return bind(1, function(a) {
        return bind((a + 1), function(b) {
          return (function() {
            return ret((a + b));
          }).call(this);
        });
      });
    })(s.m_DASH_identity)), "identity monad"), (function() {
    try {
      (function(mo) {
        let bind = mo["bind"];
        let unit = mo["unit"];
        let zero = mo["zero"];
        let ret = function() {
          let ____args = Array.prototype.slice.call(arguments);
          return ((kirbystdlibref.nichts_QUERY(____args[0]) && ((typeof (zero) !== "undefined"))) ?
            zero :
            unit(____args[0]));
        };
        return bind(null, function(a) {
          return bind(a, function(b) {
            return bind(b.toString(), function(c) {
              return (function() {
                return ret((a + b + c));
              }).call(this);
            });
          });
        });
      })(s.m_DASH_identity);
      return kirbystdlibref.ensureTestThrown("any", null, "identity monad->boom");
    } catch (e) {
      return kirbystdlibref.ensureTestThrown("any", e, "identity monad->boom");
    }
  }).call(this), kirbystdlibref.ensureTest((3 === (function(mo) {
      let bind = mo["bind"];
      let unit = mo["unit"];
      let zero = mo["zero"];
      let ret = function() {
        let ____args = Array.prototype.slice.call(arguments);
        return ((kirbystdlibref.nichts_QUERY(____args[0]) && ((typeof (zero) !== "undefined"))) ?
          zero :
          unit(____args[0]));
      };
      return bind(1, function(a) {
        return bind((a + 1), function(b) {
          return (function() {
            return ret((a + b));
          }).call(this);
        });
      });
    })(s.m_DASH_maybe)), "maybe monad"), kirbystdlibref.ensureTest((((function(mo) {
      let bind = mo["bind"];
      let unit = mo["unit"];
      let zero = mo["zero"];
      let ret = function() {
        let ____args = Array.prototype.slice.call(arguments);
        return ((kirbystdlibref.nichts_QUERY(____args[0]) && ((typeof (zero) !== "undefined"))) ?
          zero :
          unit(____args[0]));
      };
      return bind(1, function(a) {
        return bind((a + 1), function(b) {
          return bind(null, function(c) {
            return (function() {
              return ret((a + b + c));
            }).call(this);
          });
        });
      });
    })(s.m_DASH_maybe) === null)), "maybe monad->nil"), kirbystdlibref.ensureTest(s.eq_QUERY([5, {
    "value": 5,
    "log": ["mult3(1)", "add2(3)"]
  }], (function(mo) {
    let bind = mo["bind"];
    let unit = mo["unit"];
    let zero = mo["zero"];
    let ret = function() {
      let ____args = Array.prototype.slice.call(arguments);
      return ((kirbystdlibref.nichts_QUERY(____args[0]) && ((typeof (zero) !== "undefined"))) ?
        zero :
        unit(____args[0]));
    };
    return bind(exlog(mult3, "mult3"), function(c1) {
      return bind(exlog(add2, "add2"), function(c2) {
        return (function() {
          return ret(c2);
        }).call(this);
      });
    });
  })(s.m_DASH_state)({
    "value": 1,
    "log": []
  })), "state monad"), kirbystdlibref.ensureTest((3 === std.run_DASH_cont((function(mo) {
      let bind = mo["bind"];
      let unit = mo["unit"];
      let zero = mo["zero"];
      let ret = function() {
        let ____args = Array.prototype.slice.call(arguments);
        return ((kirbystdlibref.nichts_QUERY(____args[0]) && ((typeof (zero) !== "undefined"))) ?
          zero :
          unit(____args[0]));
      };
      return bind((function(v) {
        return function(c) {
          return c(v);
        };
      })(1), function(x) {
        return bind((function(v) {
          return function(c) {
            return c(v);
          };
        })(2), function(y) {
          return (function() {
            return ret((x + y));
          }).call(this);
        });
      });
    })(std.m_DASH_continuation))), "continuation monad"), kirbystdlibref.ensureTest((function() {
    let f = function(v) {
      return function(s) {
        return [v, s];
      };
    };
    let lhs = s.m_DASH_state.bind(s.m_DASH_state.unit(911), f);
    let rhs = f(911);
    let lf = lhs("hello");
    let rt = rhs("hello");
    return ((kirbystdlibref.getProp(lf, 0) === kirbystdlibref.getProp(rt, 0)) && (s.last(lf) === s.last(rt)));
  }).call(this), "monad rule 1: bind(unit(x), f) ≡ f(x)"), kirbystdlibref.ensureTest((function() {
    let mv = function(s) {
      return [3, s];
    };
    let lhs = s.m_DASH_state.bind(mv, s.m_DASH_state.unit);
    let lf = lhs("hello");
    let rt = mv("hello");
    return ((kirbystdlibref.getProp(lf, 0) === kirbystdlibref.getProp(rt, 0)) && (s.last(lf) === s.last(rt)));
  }).call(this), "monad rule 2: bind(m, unit) ≡ m"), kirbystdlibref.ensureTest((function() {
    let f = function(v) {
      return function(s) {
        return [3, s];
      };
    };
    let g = function(v) {
      return function(s) {
        return [5, s];
      };
    };
    let bb = s.m_DASH_state.bind;
    let mv = function(s) {
      return [7, s];
    };
    let lhs = bb(bb(mv, f), g);
    let rhs = bb(mv, function(v) {
      return bb(f(v), g);
    });
    let lf = lhs("hello");
    let rt = rhs("hello");
    return ((kirbystdlibref.getProp(lf, 0) === kirbystdlibref.getProp(rt, 0)) && (s.last(lf) === s.last(rt)));
  }).call(this), ["monad rule 3:", " bind(bind(m, f), g)", " ≡ bind(m, v ⇒ bind(f(v), g))"].join("")), (function() {
    try {
      throw new Error(["hello", "world"].join(""));
      return kirbystdlibref.ensureTestThrown("object", null, "raise!");
    } catch (e) {
      return kirbystdlibref.ensureTestThrown("object", e, "raise!");
    }
  }).call(this), (function() {
    try {
      throw ["hello", "world"].join("");
      return kirbystdlibref.ensureTestThrown("string", null, "trap!");
    } catch (e) {
      return kirbystdlibref.ensureTestThrown("string", e, "trap!");
    }
  }).call(this), kirbystdlibref.ensureTest(("hello" === new Error("hello").message), "merror")];
};
s.println(std.runtest(test_DASH_stdlib, "Kirby stdlib test-suite"));
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.test.stdlib",
    macros: {}
  },
  test_DASH_stdlib: test_DASH_stdlib
};