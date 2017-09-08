// Generated by LispyScript v1.5.0
function some_QUERY(obj) {
  return (!((typeof(obj) === "undefined") || (Object.prototype.toString.call(obj) === "[object Null]")));
}
function zero_QUERY(obj) {
  return ((typeof(obj) === "number") ?
    (0 == obj) :
    false);
}
function make_array(len,obj) {
  return   (function() {
  let ret = [];
  return   (function() {
  for (var i = 0; (i < len); i = (i + 1)) {
        (function() {
    return ret.push(obj);
    })();
  }
;
  return ret;
  })();
  })();
}
function each_key(func,obj) {
  return function (k) {
    return func(obj[k],k,obj);
  }.forEach(Object.keys(obj));
}
function last(coll) {
  return coll[((coll)["length"] - 1)];
}
function nth(coll,pos) {
  return coll[pos];
}
function pos_QUERY(arg) {
  return ((typeof(arg) === "number") && (arg > 0));
}
function neg_QUERY(arg) {
  return ((typeof(arg) === "number") && (arg < 0));
}
function constantly(x) {
  return function () {
    return x;
  };
}
function identity(x) {
  return x;
}
function repeat(n,expr) {
  return [];
}
function conj_BANG(c,a) {
  c.push(a);
  return c;
}
function conj_BANG_BANG(c,a) {
  (a ?
    c.push(a) :
    undefined);
  return c;
}
function not_empty(x) {
  return ((x && ((x)["length"] > 0)) ?
    x :
    null);
}
function empty_QUERY(x) {
  return (x ?
    (0 == (x)["length"]) :
    false);
}
function seq(x) {
  return ((typeof(x) === "string") ?
    Array.from(x) :
    ((Object.prototype.toString.call(x) === "[object Array]") ?
      x :
      ((Object.prototype.toString.call(x) === "[object Object]") ?
        Object.entries(x) :
        (true ?
          [] :
          undefined))));
}
var TreeNode = (require("source-map"))["SourceNode"];
var _STARfs_STAR = null,
  _STARpath_STAR = null;
var REGEX = {
  macroGet: new RegExp("^#slice@(\\d+)"),
  noret: new RegExp("^def\\b|^var\\b|^set!\\b|^throw\\b"),
  id: new RegExp("^[a-zA-Z_$][?\\-*!0-9a-zA-Z_$]*$"),
  id2: new RegExp("^[*][?\\-*!0-9a-zA-Z_$]+$"),
  func: new RegExp("^function\\b"),
  query: new RegExp("\\?","g"),
  bang: new RegExp("!","g"),
  dash: new RegExp("-","g"),
  star: new RegExp("\\*","g"),
  wspace: new RegExp("\\s")
};
var KIRBY = "____kirby";
((typeof(window) === "undefined") ?
    (function() {
  _STARpath_STAR = require("path");
  return _STARfs_STAR = require("fs");
  })() :
  undefined);
function testid_QUERY(name) {
  return (REGEX.id.test(name) || REGEX.id2.test(name));
}
function normalizeId(name) {
  let pfx = "";
  (((typeof(name) === "string") && ("-" === name.charAt(0))) ?
    pfx = "-" :
    name = name.slice(1));
  return (testid_QUERY(name) ?
    [pfx,name.replace(REGEX.query,"_QUERY").replace(REGEX.bang,"_BANG").replace(REGEX.dash,"_").replace(REGEX.star,"_STAR")].join("") :
    ((pfx === "") ?
      name :
      [pfx,name].join("")));
}
function tnodeString() {
  return   (function() {
  let s = "";
  return   (function() {
  this.walk(function (chunk,hint) {
    (((hint.name === chunk) && (typeof(chunk) === "string")) ?
      chunk = normalizeId(chunk) :
      undefined);
    return s += chunk;
  });
  return s;
  })();
  })();
}
function tnode(ln,col,src,chunk,name) {
  return   (function() {
  let n = null;
  return   (function() {
  (((arguments)["length"] > 0) ?
    n = (name ?
      new TreeNode(ln,col,src,chunk,name) :
      new TreeNode(ln,col,src,chunk)) :
    n = new TreeNode());
  n[KIRBY] = {};
  n[toString] = tnodeString;
  return n;
  })();
  })();
}
function tnodeChunk(chunk,name) {
  return tnode(null,null,null,chunk,name);
}
function addToken(tree,token,context) {
  return   (function() {
  let ret = "";
  return   (function() {
  (token ?
        (function() {
    ((":else" === token) ?
      token = "true" :
      undefined);
    (("nil" === token) ?
      token = "null" :
      undefined);
    (((token.startsWith(":") || token.startsWith("'")) && testid_QUERY(token.substring(1))) ?
      token = ["\"",token.substring(1),"\""].join("") :
      undefined);
    return conj_BANG_BANG(tree,tnode(context.lineno,(context.tknCol - 1),context.filename,token,token));
    })() :
    undefined);
  return ret;
  })();
  })();
}
function lexer(prevToken,context) {
  let ____BREAK_BANG = null,
    formType = null,
    token = "",
    ch = null,
    escStr_QUERY = false,
    isStr_QUERY = false,
    comment_QUERY = false;
  return   (function() {
  let tree = [];
  return   (function() {
  ->>([
    "filename",
    "lineno"
  ].reduce(function (acc,k) {
    acc[k] = context[k];
    return acc;
  },{}),tree = KIRBY);
  (("[" === prevToken) ?
    state["array"] = true :
    (("{" === prevToken) ?
      state["object"] = true :
      undefined));
  ____BREAK_BANG = false;
  while ((!____BREAK_BANG) && (context.pos < (context.code)["length"])) {
  (function() {
  ch = context.code.charAt(context.pos);
  ++context.colno;
  ++context.pos;
  ((ch === "\n") ?
        (function() {
    ++context.lineno;
    context.colno = 1;
    return (comment_QUERY ?
      comment_QUERY = (!comment_QUERY) :
      undefined);
    })() :
    undefined);
  return (comment_QUERY ?
    null :
    (escStr_QUERY ?
            (function() {
      escStr_QUERY = (!escStr_QUERY);
      return token += ch;
      })() :
      ((ch === "\"") ?
                (function() {
        inStr_QUERY = (!inStr_QUERY);
        return token += ch;
        })() :
        (inStr_QUERY ?
                    (function() {
          ((ch === "\n") ?
            ch = "\\n" :
            undefined);
          ((ch === "\\") ?
            escStr_QUERY = true :
            undefined);
          return token += ch;
          })() :
          ((ch === "'") ?
            token += ch :
            (((ch === "[") || (ch === "]")) ?
                            (function() {
              token = addToken(tree,token,context);
              context.tknCol = context.colno;
              return ((ch === "[") ?
                                (function() {
                formType = "array";
                return conj_BANG_BANG(tree,lexer(ch,context));
                })() :
                                (function() {
                formType = null;
                return ____BREAK_BANG = true;
                })());
              })() :
              (((ch === "{") || (ch === "}")) ?
                                (function() {
                token = addToken(tree,token,context);
                context.tknCol = context.colno;
                return ((ch === "{") ?
                                    (function() {
                  formType = "object";
                  return conj_BANG_BANG(tree,lexer(ch,context));
                  })() :
                                    (function() {
                  formType = null;
                  return ____BREAK_BANG = true;
                  })());
                })() :
                ((ch === ";") ?
                  comment_QUERY = true :
                  (((ch === "(") || (ch === ")")) ?
                                        (function() {
                    token = addToken(tree,token,context);
                    context.tknCol = context.colno;
                    return ((ch === "(") ?
                                            (function() {
                      formType = "list";
                      return conj_BANG_BANG(tree,lexer(null,context));
                      })() :
                                            (function() {
                      formType = null;
                      return ____BREAK_BANG = true;
                      })());
                    })() :
                    (REGEX.wspace.test(ch) ?
                                            (function() {
                      ((ch === "\n") ?
                        --lineno :
                        undefined);
                      token = addToken(tree,token,context);
                      ((ch === "\n") ?
                        ++lineno :
                        undefined);
                      return context.tknCol = context.colno;
                      })() :
                      (true ?
                        token += ch :
                        undefined)))))))))));
  })();
}
;
  (isStr_QUERY ?
    syntax_BANG("e3",tree) :
    undefined);
  ((formType === "array") ?
    syntax_BANG("e5",tree) :
    ((formType === "object") ?
      syntax_BANG("e7",tree) :
      ((formType === "list") ?
        syntax_BANG("e8",tree) :
        undefined)));
  return tree;
  })();
  })();
}
