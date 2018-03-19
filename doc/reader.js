/*Auto generated by Kirby v1.0.0 - Sun Mar 18 2018 16:59:52 GMT-0700 (PDT)
  czlab.kirby.reader
{"doc" "Tokenizes the input stream, and build a Abstract Syntax Tree." "author" "Kenneth Leung"}
*/

const std = require("./stdlib");
const lambdaArg = std["lambdaArg"];
const object_QMRK = std["object_QMRK"];
const nichts_QMRK = std["nichts_QMRK"];
const count = std["count"];
const into_BANG = std["into_BANG"];
const vector = std["vector"];
const conj_BANG = std["conj_BANG"];
const prn = std["prn"];
const quote_DASH_str = std["quote_DASH_str"];
const list_QMRK = std["list_QMRK"];
const vector_QMRK = std["vector_QMRK"];
const map_QMRK = std["map_QMRK"];
const escXml = std["escXml"];
const println = std["println"];
const regexObj = std["regexObj"];
const regexObj_QMRK = std["regexObj_QMRK"];
const set_QMRK = std["set_QMRK"];
const symbol_QMRK = std["symbol_QMRK"];
const keyword_QMRK = std["keyword_QMRK"];
const lambdaArg_QMRK = std["lambdaArg_QMRK"];
const carve = std["carve"];
const opt_QMRK__QMRK = std["opt_QMRK__QMRK"];
const symbol = std["symbol"];
const primitive_QMRK = std["primitive_QMRK"];
const keyword = std["keyword"];
const contains_QMRK = std["contains_QMRK"];
const list = std["list"];
const not_DASH_empty = std["not_DASH_empty"];
const kirbystdlibref = std;
const __module_namespace__ = "czlab.kirby.reader";
class Token {
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [constructor] in file: reader.ky, line: 28
  constructor(source, line, column, value) {
    (this["source"] = source, this["value"] = value, this["line"] = line, this["column"] = column);
    return this;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //fn: [toString] in file: reader.ky, line: 34
  toString() {
    return this.value;
  }
}
////////////////////////////////////////////////////////////////////////////////
//fn: [mkToken] in file: reader.ky, line: 37
//Create a token
const mkToken = function(source, line, col, chunk) {
  return new Token(source, line, col, chunk);
};
const REGEX = {
  id: /^[a-zA-Z_$][\/.?\-*!0-9a-zA-Z_'<>%#@$\+]*$/,
  id2: /^[*\-][\/.?\-*!0-9a-zA-Z_'<>%#@$\+]+$/,
  float: /^[-+]?[0-9]+\.[0-9]+$/,
  int: /^[-+]?[0-9]+$/,
  hex: /^[-+]?0x/,
  dquoteHat: /^"/,
  dquoteEnd: /"$/,
  func: /^function\b/,
  slash: /\//g,
  query: /\?/g,
  perc: /%/g,
  bang: /!/g,
  plus: /\+/g,
  dash: /-/g,
  quote: /'/g,
  hash: /#/g,
  at: /@/g,
  less: /</g,
  greater: />/g,
  star: /\*/g,
  wspace: /\s/
};
const REPLACERS = [[REGEX.query, "_QMRK_"], [REGEX.bang, "_BANG_"], [REGEX.dash, "_DASH_"], [REGEX.quote, "_QUOT_"], [REGEX.hash, "_HASH_"], [REGEX.plus, "_PLUS_"], [REGEX.perc, "_PERC_"], [REGEX.at, "_AT_"], [REGEX.less, "_LT_"], [REGEX.greater, "_GT_"], [REGEX.star, "_STAR_"]];
////////////////////////////////////////////////////////////////////////////////
//fn: [testid?] in file: reader.ky, line: 79
//Returns true
//if a valid js identifier
const testid_QMRK = function(name) {
  return (REGEX.id.test(name) || REGEX.id2.test(name));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [jsid] in file: reader.ky, line: 85
//Escape to
//compliant js identifier
const jsid = function(input) {
  let pfx = "";
  let name = [input].join("");
  if ( (name && name.startsWith("-")) ) {
    (pfx = "-", name = name.slice(1));
  }
  return (testid_QMRK(name) ?
    REPLACERS.reduce(function(acc, x) {
      (
      acc = acc.replace(x[0], x[1]));
      return (acc.endsWith(x[1]) ?
        acc.slice(0, -1) :
        acc);
    }, [pfx, name].join("").replace(REGEX.slash, ".")) :
    ((pfx === "") ?
      name :
      [pfx, name].join("")));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [lexer] in file: reader.ky, line: 103
//Lexical analyzer
const lexer = function(source, fname) {
  let len = kirbystdlibref.count(source);
  let comment_QMRK = false;
  let fform_QMRK = false;
  let esc_QMRK = false;
  let str_QMRK = false;
  let regex_QMRK = false;
  let token = "";
  let line = 1;
  let ch = null;
  let nx = null;
  let col = 0;
  let pos = 0;
  let tree = [];
  let tcol = col;
  let tline = line;
  let toke = function(ln, col, s, s_QMRK) {
    if (opt_QMRK__QMRK(s_QMRK, not_DASH_empty(s))) {
      if ( (s.startsWith("&") && (s !== "&&") && (s.length > 1)) ) {
        conj_BANG(tree, mkToken(fname, ln, col, "&"));
        (
        s = s.slice(1));
      } else {
        if ( (s == "?") ) {
          (
          s = "undefined");
        } else {
          if (s.startsWith("@@")) {
            (
            s = ["this.", s.slice(2)].join(""));
          } else {
            null;
          }
        }
      }
      conj_BANG(tree, mkToken(fname, ln, col, s));
    }
    return "";
  };
  for (let ____break = false; ((!____break) && (pos < len));) {
    (
    ch = source.charAt(pos));
    ++col;
    ++pos;
    (
    nx = source.charAt(pos));
    if ( (ch == "\n") ) {
      (
      col = 0);
      ++line;
      if (comment_QMRK) {
        (
        comment_QMRK = false);
      }
    }
    if (comment_QMRK) {
      null;
    } else {
      if (esc_QMRK) {
        (
        esc_QMRK = false);
        (
        token += ch);
      } else {
        if (regex_QMRK) {
          if ( (ch == "\\") ) {
            (
            esc_QMRK = true);
          }
          (token += ch);
          if ( (ch == "/") ) {
            (
            regex_QMRK = false);
            if (contains_QMRK("gimuy", nx)) {
              (
              token += nx);
              ++pos;
            }
            (token = toke(tline, tcol, token));
          }
        } else {
          if (fform_QMRK) {
            if ( ((ch == "`") && (nx == "`") && (source.charAt((pos + 1)) == "`")) ) {
              (
              fform_QMRK = false);
              (
              pos += 2);
              (
              token += "\"");
              (
              token = toke(tline, tcol, token, true));
            } else {
              if ( (ch == "\"") ) {
                (
                token += "\\\"");
              } else {
                if ( (ch == "\n") ) {
                  (
                  token += "\\n");
                } else {
                  if ( (ch == "\\") ) {
                    if ( ((nx == "n") || (nx == "r") || (nx == "u") || (nx == "t") || (nx == "f") || (nx == "v")) ) {
                      (
                      token += ch);
                    } else {
                      (
                      token += "\\\\");
                    }
                  } else {
                    if (true) {
                      (
                      token += ch);
                    }
                  }
                }
              }
            }
          } else {
            if ( ((ch == "`") && (nx == "`") && (source.charAt((pos + 1)) == "`") && (0 === kirbystdlibref.count(token))) ) {
              (tline = line, tcol = col);
              (
              pos += 2);
              (
              fform_QMRK = true);
              (
              token += "\"");
            } else {
              if ( (ch == "\"") ) {
                if ( (!str_QMRK) ) {
                  (tline = line, tcol = col);
                  (
                  str_QMRK = true);
                  (
                  token += ch);
                } else {
                  (
                  str_QMRK = false);
                  (
                  token += ch);
                  (
                  token = toke(tline, tcol, token, true));
                }
              } else {
                if (str_QMRK) {
                  if ( (ch == "\n") ) {
                    (
                    ch = "\\n");
                  }
                  if ( (ch == "\\") ) {
                    (
                    esc_QMRK = true);
                  }
                  (token += ch);
                } else {
                  if ( ((ch == "@") && (nx == "@") && (0 === kirbystdlibref.count(token))) ) {
                    (tline = line, tcol = col);
                    (
                    token += "@@");
                    ++pos;
                  } else {
                    if ( ((ch == "`") && (nx == "{")) ) {
                      (token = toke(tline, tcol, token), tline = line, tcol = col);
                      ++pos;
                      toke(tline, tcol, "`{");
                    } else {
                      if ( ((ch == "'") || (ch == "`") || (ch == "$") || (ch == "@") || (ch == "^")) ) {
                        if ( ((0 === kirbystdlibref.count(token)) && (!REGEX.wspace.test(nx))) ) {
                          (tline = line, tcol = col);
                          toke(tline, tcol, ch);
                        } else {
                          (
                          token += ch);
                        }
                      } else {
                        if ( ((ch == "&") && (nx == "&")) ) {
                          if ( (0 === kirbystdlibref.count(token)) ) {
                            (tline = line, tcol = col);
                          }
                          (token += "&&");
                          ++pos;
                        } else {
                          if ( (ch == "~") ) {
                            if ( ((0 === kirbystdlibref.count(token)) && (!REGEX.wspace.test(nx))) ) {
                              (tline = line, tcol = col);
                              if ( (nx == "@") ) {
                                ++pos;
                                toke(tline, tcol, "~@");
                              } else {
                                toke(tline, tcol, ch);
                              }
                            } else {
                              (
                              token += ch);
                            }
                          } else {
                            if ( ((ch == "#") && (nx == "/") && (0 === kirbystdlibref.count(token))) ) {
                              (
                              regex_QMRK = true);
                              (tline = line, tcol = col);
                              ++pos;
                              (
                              token += "#/");
                            } else {
                              if ( ((ch == "#") && (nx == "{")) ) {
                                (token = toke(tline, tcol, token), tline = line, tcol = col);
                                ++pos;
                                toke(tline, tcol, "#{");
                              } else {
                                if ( ((ch == "[") || (ch == "]") || (ch == "{") || (ch == "}") || (ch == "(") || (ch == ")")) ) {
                                  (token = toke(tline, tcol, token), tline = line, tcol = col);
                                  toke(tline, tcol, ch);
                                } else {
                                  if ( (ch == ";") ) {
                                    (token = toke(tline, tcol, token), tline = line, tcol = col, comment_QMRK = true);
                                  } else {
                                    if ( ((ch == ",") || REGEX.wspace.test(ch)) ) {
                                      (
                                      token = toke(((ch == "\n") ?
                                        (tline - 1) :
                                        tline), tcol, token));
                                    } else {
                                      if (true) {
                                        if ( (0 === kirbystdlibref.count(token)) ) {
                                          (tline = line, tcol = col);
                                        }
                                        (token += ch);
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  let tmp = (new Map([["source", fname], ["line", tline], ["column", col]]));
  if (fform_QMRK) {
    throwE(tmp, "unterminated free-form");
  }
  if (esc_QMRK) {
    throwE(tmp, "incomplete escape");
  }
  if (str_QMRK) {
    throwE(tmp, "unterminated string");
  }
  if (regex_QMRK) {
    throwE(tmp, "unterminated regex definition");
  }
  return tree;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [throwE] in file: reader.ky, line: 275
//Raise an error
const throwE = function(token) {
  let msgs = Array.prototype.slice.call(arguments, 1);
  let s = msgs.join("");
  return (token ?
    (function() {
      throw new Error([s, "\nnear line: ", token.line, "\nin file: ", token.source].join(""));
    }).call(this) :
    (function() {
      throw new Error([s, "\nnear EOF"].join(""));
    }).call(this));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [popToken] in file: reader.ky, line: 285
//Returns the next token,
//updates the token index
const popToken = function(tokens) {
  let t = peekToken(tokens);
  ++tokens.pos;
  return t;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [peekToken] in file: reader.ky, line: 291
//Returns the next token,
//without moving the token index
const peekToken = function(tokens) {
  return tokens[tokens.pos];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [prevToken] in file: reader.ky, line: 296
//Returns the previous token
const prevToken = function(tokens) {
  return tokens[(tokens.pos - 1)];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [copyTokenData] in file: reader.ky, line: 300
//Attach source level information
//to the node
const copyTokenData = function(token, node) {
  if ( (object_QMRK(node) || ((Object.prototype.toString.call(node) === "[object Map]")) || ((Object.prototype.toString.call(node) === "[object Set]")) || (Array.isArray(node))) ) {
    (node["source"] = token.source, node["line"] = token.line, node["column"] = token.column);
  }
  return node;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readAtom] in file: reader.ky, line: 312
//Process an atom
const readAtom = function(tokens) {
  let token = popToken(tokens);
  let ret = null;
  let tn = token.value;
  if ( (0 === kirbystdlibref.count(tn)) ) {
    (
    ret = undefined);
  } else {
    if (REGEX.float.test(tn)) {
      (
      ret = parseFloat(tn));
    } else {
      if ( (REGEX.hex.test(tn) || REGEX.int.test(tn)) ) {
        (
        ret = parseInt(tn));
      } else {
        if ( (tn.startsWith("\"") && tn.endsWith("\"")) ) {
          (
          ret = std.unquote_DASH_str(tn));
        } else {
          if (tn.startsWith(":")) {
            (
            ret = keyword(tn));
          } else {
            if (tn.startsWith("%")) {
              (
              ret = lambdaArg(tn));
            } else {
              if ( (tn.startsWith("#/") && (tn.endsWith("/") || tn.slice(0, -1).endsWith("/"))) ) {
                (
                ret = regexObj(tn));
              } else {
                if ( ((tn == "nil") || (tn == "null")) ) {
                  (
                  ret = null);
                } else {
                  if ( ((tn == "#t") || (tn == "true")) ) {
                    (
                    ret = true);
                  } else {
                    if ( ((tn == "#f") || (tn == "false")) ) {
                      (
                      ret = false);
                    } else {
                      if (true) {
                        (
                        ret = symbol(tn));
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return copyTokenData(token, ret);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readBlock] in file: reader.ky, line: 349
//Process a LISP form
const readBlock = function(tokens, head, tail) {
  let token = popToken(tokens);
  let ast = [];
  let ok_QMRK = true;
  let start = token;
  if ( (token.value !== head) ) {
    throwE(token, "expected '", head, "'");
  }
  for (let cur = peekToken(tokens), ____break = false; (!____break);) {
    if (nichts_QMRK(cur)) {
      throwE(start, "expected '", tail, "', got EOF");
    } else {
      if ( (tail == cur.value) ) {
        (
        ____break = true);
      } else {
        if (true) {
          addAst(ast, read_STAR(tokens));
          (
          cur = peekToken(tokens));
        }
      }
    }
  }
  popToken(tokens);
  return copyTokenData(start, ast);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readList] in file: reader.ky, line: 371
//Process an expression
const readList = function(tokens) {
  return readBlock(tokens, "(", ")");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readVector] in file: reader.ky, line: 375
//Process a Vector
const readVector = function(tokens) {
  return into_BANG("vector", readBlock(tokens, "[", "]"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readObjectMap] in file: reader.ky, line: 380
//Process a ObjectMap
const readObjectMap = function(tokens) {
  return into_BANG("map", readBlock(tokens, "{", "}"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readObject] in file: reader.ky, line: 385
//Process a Object
const readObject = function(tokens) {
  return into_BANG("obj", readBlock(tokens, "`{", "}"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readObjectSet] in file: reader.ky, line: 390
//Process a ObjectSet
const readObjectSet = function(tokens) {
  return into_BANG("set", readBlock(tokens, "#{", "}"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [skipParse] in file: reader.ky, line: 395
//Advance the token index,
//then continue to parse
const skipParse = function(tokens, func) {
  let t = popToken(tokens);
  let ret = func(tokens);
  let a1 = ret[0];
  copyTokenData(t, a1);
  return copyTokenData(t, ret);
};
const _STAR_spec_DASH_tokens_STAR = (new Map([["'", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.symbol("quote"), read_STAR(____args[0])];
}], ["`", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.symbol("syntax-quote"), read_STAR(____args[0])];
}], ["~", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.symbol("unquote"), read_STAR(____args[0])];
}], ["~@", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.symbol("splice-unquote"), read_STAR(____args[0])];
}], ["^", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (function() {
    let tmp = read_STAR(____args[0]);
    return [kirbystdlibref.symbol("with-meta"), read_STAR(____args[0]), tmp];
  }).call(this);
}], ["@", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.symbol("deref"), read_STAR(____args[0])];
}], ["$", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (function() {
    let y = read_STAR(____args[0]);
    let x = kirbystdlibref.symbol("str");
    if ( (y.length > 1) ) {
      (
      y = [x, y]);
    } else {
      y.unshift(x);
    }
    return y;
  }).call(this);
}], ["#", function() {
  let ____args = Array.prototype.slice.call(arguments);
  return [kirbystdlibref.symbol("lambda"), read_STAR(____args[0])];
}], ["[", [function() {
  let ____args = Array.prototype.slice.call(arguments);
  return readVector(____args[0]);
}]], ["(", [function() {
  let ____args = Array.prototype.slice.call(arguments);
  return readList(____args[0]);
}]], ["#{", [function() {
  let ____args = Array.prototype.slice.call(arguments);
  return readObjectSet(____args[0]);
}]], ["`{", [function() {
  let ____args = Array.prototype.slice.call(arguments);
  return readObject(____args[0]);
}]], ["{", [function() {
  let ____args = Array.prototype.slice.call(arguments);
  return readObjectMap(____args[0]);
}]]]));
////////////////////////////////////////////////////////////////////////////////
//fn: [read*] in file: reader.ky, line: 425
//Inner parser routine
const read_STAR = function(tokens) {
  let token = peekToken(tokens);
  let tval = (token ?
    token.value :
    "");
  let func = kirbystdlibref.getProp(_STAR_spec_DASH_tokens_STAR, tval);
  return ((Array.isArray(func)) ?
    func[0].apply(this, [tokens]) :
    (((typeof (func) === "function")) ?
      skipParse(tokens, func) :
      (nichts_QMRK(token) ?
        undefined :
        (((tval == ";") || (tval == ",")) ?
          (function() {
            popToken(tokens);
            return undefined;
          }).call(this) :
          (true ?
            readAtom(tokens) :
            null)))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [addAst] in file: reader.ky, line: 440
const addAst = function(ast, f) {
  if ( (!((typeof (f) === "undefined"))) ) {
    conj_BANG(ast, f);
  } else {
    null;
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [parse] in file: reader.ky, line: 445
//Main parser routine
const parse = function(source) {
  let GS__2 = Array.prototype.slice.call(arguments, 1);
  let fname = kirbystdlibref.getIndex(GS__2, 0);
  let tokens = lexer(source, opt_QMRK__QMRK(fname, "*adhoc*"));
  let f = null;
  let ast = [];
  let tlen = kirbystdlibref.count(tokens);
  (tokens.pos = 0);
  if (false) {
    tokens.forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return println("token=", ____args[0].name);
    });
  }
  for (let ____break = false; ((!____break) && (tokens.pos < tlen));) {
    addAst(ast, read_STAR(tokens));
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dumpInfo] in file: reader.ky, line: 460
const dumpInfo = function(tag, ast) {
  return ((ast && ((typeof (ast.line) === "number"))) ?
    ["<", tag, " line=", "\"", ast.line, "\"", " column=", "\"", ast.column, "\"", ">"].join("") :
    ["<", tag, ">"].join(""));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dump*] in file: reader.ky, line: 470
//Debug and dump the AST
const dump_STAR = function(tree) {
  let s = "";
  if (primitive_QMRK(tree)) {
    (
    tree = tree.value);
  }
  return (vector_QMRK(tree) ?
    [dumpInfo("vector", tree), tree.map(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return dump_STAR(____args[0]);
    }).join(""), "</vector>"].join("") :
    (set_QMRK(tree) ?
      [dumpInfo("set", tree), tree.map(function() {
        let ____args = Array.prototype.slice.call(arguments);
        return dump_STAR(____args[0]);
      }).join(""), "</set>"].join("") :
      (map_QMRK(tree) ?
        [dumpInfo("map", tree), tree.map(function() {
          let ____args = Array.prototype.slice.call(arguments);
          return dump_STAR(____args[0]);
        }).join(""), "</map>"].join("") :
        (list_QMRK(tree) ?
          [dumpInfo("list", tree), tree.map(function() {
            let ____args = Array.prototype.slice.call(arguments);
            return dump_STAR(____args[0]);
          }).join(""), "</list>"].join("") :
          ((Array.isArray(tree)) ?
            [dumpInfo("sexpr", tree), tree.map(function() {
              let ____args = Array.prototype.slice.call(arguments);
              return dump_STAR(____args[0]);
            }).join(""), "</sexpr>"].join("") :
            (lambdaArg_QMRK(tree) ?
              [dumpInfo("lambda-arg", tree), tree.value, "</lambda-arg>"].join("") :
              (keyword_QMRK(tree) ?
                [dumpInfo("keyword", tree), escXml(tree.value), "</keyword>"].join("") :
                (symbol_QMRK(tree) ?
                  [dumpInfo("symbol", tree), escXml(tree.value), "</symbol>"].join("") :
                  (regexObj_QMRK(tree) ?
                    [dumpInfo("regex", tree), escXml(tree.value), "</regex>"].join("") :
                    (((typeof (tree) === "string")) ?
                      ["<string>", escXml(quote_DASH_str(tree)), "</string>"].join("") :
                      (((typeof (tree) === "number")) ?
                        ["<number>", tree, "</number>"].join("") :
                        (((tree === null)) ?
                          ["<reserved>", "null", "</reserved>"].join("") :
                          (((tree === true)) ?
                            ["<boolean>", true, "</boolean>"].join("") :
                            (((tree === false)) ?
                              ["<boolean>", false, "</boolean>"].join("") :
                              (((typeof (tree) === "undefined")) ?
                                ["<reserved>", "undefined", "</reserved>"].join("") :
                                (true ?
                                  throwE(tree, "Bad AST") :
                                  null))))))))))))))));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dumpTree] in file: reader.ky, line: 523
//Debug and dump the AST
const dumpTree = function(tree, fname) {
  return ["<AbstractSyntaxTree file=\"", escXml(fname), "\">", dump_STAR(tree), "</AbstractSyntaxTree>"].join("");
};
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.reader",
    macros: {}
  },
  Token: Token,
  REGEX: REGEX,
  testid_QMRK: testid_QMRK,
  jsid: jsid,
  parse: parse,
  dumpTree: dumpTree
};