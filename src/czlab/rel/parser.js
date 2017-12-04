/*Auto generated by Kirby - v1.0.0 czlab.kirby.parser - Mon Dec 04 2017 03:45:28 GMT-0800 (PST)*/

const smap = require("source-map");
const std = require("./stdlib");
const lambda_DASH_arg = std["lambda_DASH_arg"];
const object_QUERY = std["object_QUERY"];
const nichts_QUERY = std["nichts_QUERY"];
const count = std["count"];
const into_BANG = std["into_BANG"];
const vector = std["vector"];
const conj_BANG = std["conj_BANG"];
const slice = std["slice"];
const opt_QUERY__QUERY = std["opt_QUERY__QUERY"];
const symbol = std["symbol"];
const keyword = std["keyword"];
const contains_QUERY = std["contains_QUERY"];
const list = std["list"];
const not_DASH_empty = std["not_DASH_empty"];
const kirbystdlibref = std;
////////////////////////////////////////////////////////////////////////////////
//fn: [tnodeEx] in file: parser.ky,line: 20
//Create a token
const tnodeEx = function(chunk, name) {
  return tnode(null, null, null, chunk, name);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [tnode] in file: parser.ky,line: 24
//Create a token
//with source information
const tnode = function() {
  let GS__3 = Array.prototype.slice.call(arguments, 0);
  let source = GS__3[0];
  let line = GS__3[1];
  let col = GS__3[2];
  let chunk = GS__3[3];
  let name = GS__3[4];
  return new smap.SourceNode(line, col, source, chunk, opt_QUERY__QUERY(name, ""));
};
const REGEX = {
  noret: /^def\b|^var\b|^set!\b|^set-in!\b|^throw\b/,
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
const REPLACERS = [
  [
    REGEX.query,
    "_QUERY_"
  ],
  [
    REGEX.bang,
    "_BANG_"
  ],
  [
    REGEX.dash,
    "_DASH_"
  ],
  [
    REGEX.quote,
    "_QUOTE_"
  ],
  [
    REGEX.hash,
    "_HASH_"
  ],
  [
    REGEX.plus,
    "_PLUS_"
  ],
  [
    REGEX.perc,
    "_PERC_"
  ],
  [
    REGEX.at,
    "_AT_"
  ],
  [
    REGEX.less,
    "_LT_"
  ],
  [
    REGEX.greater,
    "_GT_"
  ],
  [
    REGEX.star,
    "_STAR_"
  ]
];
////////////////////////////////////////////////////////////////////////////////
//fn: [testid?] in file: parser.ky,line: 70
//Returns true
//if a valid js identifier
const testid_QUERY = function(name) {
  return (REGEX.id.test(name) || REGEX.id2.test(name));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [jsid] in file: parser.ky,line: 77
//Escape to
//compliant js identifier
const jsid = function(input) {
  let pfx = "";
  let name = [
    input
  ].join("");
  if ( (name && name.startsWith("-")) ) {
    (pfx = "-", name = name.slice(1));
  }
  return (testid_QUERY(name) ?
    REPLACERS.reduce(function(acc, x) {
      acc = acc.replace(x[0], x[1]);
      return (acc.endsWith(x[1]) ?
        acc.slice(0, -1) :
        acc);
    }, [
      pfx,
      name
    ].join("").replace(REGEX.slash, ".")) :
    ((pfx === "") ?
      name :
      [
        pfx,
        name
      ].join("")));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [lexer] in file: parser.ky,line: 97
//Lexical analyzer
const lexer = function(source, fname) {
  let regex_QUERY = false;
  let comment_QUERY = false;
  let col = 0;
  let pos = 0;
  let fform_QUERY = false;
  let esc_QUERY = false;
  let str_QUERY = false;
  let len = kirbystdlibref.count(source);
  let token = "";
  let line = 1;
  let ch = null;
  let nx = null;
  let tree = [];
  let tline = line;
  let tcol = col;
  let toke = function(ln, col, s, s_QUERY) {
    if (opt_QUERY__QUERY(s_QUERY, not_DASH_empty(s))) {
      if ( (s.startsWith("&") && (s !== "&&") && (s.length > 1)) ) {
        conj_BANG(tree, tnode(fname, ln, col, "&", "&"));
        s = s.slice(1);
      }
      conj_BANG(tree, tnode(fname, ln, col, s, s));
    }
    return "";
  };
  for (let ____break = false; ((!____break) && (pos < len));) {
    ch = source.charAt(pos);
    ++col;
    ++pos;
    nx = source.charAt(pos);
    if ( (ch === "\n") ) {
      col = 0;
      ++line;
      if (comment_QUERY) {
        comment_QUERY = false;
      }
    }
    if (comment_QUERY) {
      null;
    } else {
      if (fform_QUERY) {
        if ( ((ch === "`") && (nx === "`") && (source.charAt((pos + 1)) === "`")) ) {
          fform_QUERY = false;
          pos += 2;
          token += "\"";
          token = toke(tline, tcol, token, true);
        } else {
          if ( (ch === "\"") ) {
            token += "\\\"";
          } else {
            if ( (ch === "\n") ) {
              token += "\\n";
            } else {
              if (true) {
                token += ch;
              }
            }
          }
        }
      } else {
        if (esc_QUERY) {
          esc_QUERY = false;
          token += ch;
        } else {
          if (regex_QUERY) {
            if ( (ch === "\\") ) {
              esc_QUERY = true;
            }
            token += ch;
            if ( (ch === "/") ) {
              regex_QUERY = false;
              if (contains_QUERY("gimuy", nx)) {
                token += nx;
                ++pos;
              }
              token = toke(tline, tcol, token);
            }
          } else {
            if ( (ch === "\"") ) {
              if ( (!str_QUERY) ) {
                (tline = line, tcol = col);
                str_QUERY = true;
                token += ch;
              } else {
                str_QUERY = false;
                token += ch;
                token = toke(tline, tcol, token, true);
              }
            } else {
              if (str_QUERY) {
                if ( (ch === "\n") ) {
                  ch = "\\n";
                }
                if ( (ch === "\\") ) {
                  esc_QUERY = true;
                }
                token += ch;
              } else {
                if ( ((ch === "`") && (nx === "`") && (source.charAt((pos + 1)) === "`") && (0 === kirbystdlibref.count(token))) ) {
                  (tline = line, tcol = col);
                  pos += 2;
                  fform_QUERY = true;
                  token += "\"";
                } else {
                  if ( ((ch === "'") || (ch === "`") || (ch === "$") || (ch === "@") || (ch === "^")) ) {
                    if ( ((0 === kirbystdlibref.count(token)) && (!REGEX.wspace.test(nx))) ) {
                      (tline = line, tcol = col);
                      toke(tline, tcol, ch);
                    } else {
                      token += ch;
                    }
                  } else {
                    if ( ((ch === "&") && (nx === "&")) ) {
                      if ( (0 === kirbystdlibref.count(token)) ) {
                        (tline = line, tcol = col);
                      }
                      token += [
                        ch,
                        nx
                      ].join("");
                      ++pos;
                    } else {
                      if ( (ch === "~") ) {
                        if ( ((0 === kirbystdlibref.count(token)) && (!REGEX.wspace.test(nx))) ) {
                          (tline = line, tcol = col);
                          if ( (nx === "@") ) {
                            ++pos;
                            toke(tline, tcol, "~@");
                          } else {
                            toke(tline, tcol, ch);
                          }
                        } else {
                          token += ch;
                        }
                      } else {
                        if ( ((ch === "/") && (0 === kirbystdlibref.count(token))) ) {
                          regex_QUERY = true;
                          (tline = line, tcol = col);
                          token += ch;
                        } else {
                          if ( ((ch === "[") || (ch === "]") || (ch === "{") || (ch === "}") || (ch === "(") || (ch === ")")) ) {
                            (token = toke(tline, tcol, token), tline = line, tcol = col);
                            toke(tline, tcol, ch);
                          } else {
                            if ( (ch === ";") ) {
                              (token = toke(tline, tcol, token), tline = line, tcol = col, comment_QUERY = true);
                            } else {
                              if ( ((ch === ",") || REGEX.wspace.test(ch)) ) {
                                token = toke(((ch === "\n") ?
                                  (tline - 1) :
                                  tline), tcol, token);
                              } else {
                                if (true) {
                                  if ( (0 === kirbystdlibref.count(token)) ) {
                                    (tline = line, tcol = col);
                                  }
                                  token += ch;
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
  return tree;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [throwE] in file: parser.ky,line: 216
//Raise an error
const throwE = function(token) {
  let msgs = Array.prototype.slice.call(arguments, 1);
  let s = msgs.join("");
  return (token ?
    (function() {
      throw new Error([
        s,
        "\nnear line: ",
        token.line,
        "\nin file: ",
        token.source
      ].join(""));
    }).call(this) :
    (function() {
      throw new Error([
        s,
        "\nnear EOF"
      ].join(""));
    }).call(this));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [nextToken] in file: parser.ky,line: 226
//Returns the next token,
//updates the token index
const nextToken = function(tokens) {
  let t = peekToken(tokens);
  ++tokens.pos;
  return t;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [peekToken] in file: parser.ky,line: 232
//Returns the next token,
//without moving the token index
const peekToken = function(tokens) {
  return tokens[tokens.pos];
};
////////////////////////////////////////////////////////////////////////////////
//fn: [copyTokenData] in file: parser.ky,line: 237
//Attach source level information
//to the node
const copyTokenData = function(token, node) {
  if ( (object_QUERY(node) || Array.isArray(node)) ) {
    (node["source"] = token.source, node["line"] = token.line, node["column"] = token.column);
  }
  return node;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readAtom] in file: parser.ky,line: 247
//Process an atom
const readAtom = function(tokens) {
  let ret = null;
  let tn = "";
  let token = nextToken(tokens);
  if (token) {
    tn = token.name;
  }
  if ( (0 === kirbystdlibref.count(tn)) ) {
    ret = undefined;
  } else {
    if (REGEX.float.test(tn)) {
      ret = parseFloat(tn);
    } else {
      if ( (REGEX.hex.test(tn) || REGEX.int.test(tn)) ) {
        ret = parseInt(tn);
      } else {
        if ( (tn.startsWith("\"") && tn.endsWith("\"")) ) {
          ret = tn;
        } else {
          if (tn.startsWith(":")) {
            ret = keyword(tn);
          } else {
            if (tn.startsWith("%")) {
              ret = lambda_DASH_arg(tn);
            } else {
              if ( (("nil" === tn) || ("null" === tn)) ) {
                ret = null;
              } else {
                if ( (("#t" === tn) || ("true" === tn)) ) {
                  ret = true;
                } else {
                  if ( (("#f" === tn) || ("false" === tn)) ) {
                    ret = false;
                  } else {
                    if (true) {
                      ret = symbol(tn);
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
//fn: [readBlock] in file: parser.ky,line: 281
//Process a LISP form
const readBlock = function(tokens, head, tail) {
  let ast = [];
  let ok_QUERY = true;
  let token = nextToken(tokens);
  let ret,
    cur,
    tn;
  if (token) {
    tn = token.name;
  }
  if ( (tn !== head) ) {
    throwE(token, "expected '", head, "'");
  }
  cur = peekToken(tokens);
  for (let ____break = false; ((!____break) && ok_QUERY);) {
    if ( (nichts_QUERY(cur) || (tail === cur.name)) ) {
      if (cur) {
        copyTokenData(token, ast);
      } else {
        throwE(cur, "expected '", tail, "', got EOF");
      }
      ok_QUERY = false;
    }
    if (ok_QUERY) {
      addAst(ast, read_STAR(tokens));
      cur = peekToken(tokens);
    }
  }
  nextToken(tokens);
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readList] in file: parser.ky,line: 304
//Process an expression
const readList = function(cur, tokens) {
  return readBlock(tokens, "(", ")");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readVector] in file: parser.ky,line: 308
//Process a Vector
const readVector = function(cur, tokens) {
  return into_BANG("vector", readBlock(tokens, "[", "]"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [readMap] in file: parser.ky,line: 313
//Process a Hashmap
const readMap = function(cur, tokens) {
  return into_BANG("map", readBlock(tokens, "{", "}"));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [skip+parse] in file: parser.ky,line: 318
//Advance the token index,
//then continue to parse
const skip_PLUS_parse = function(tokens, func) {
  return copyTokenData(nextToken(tokens), func(tokens));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [read*] in file: parser.ky,line: 324
//Inner parser routine
const read_STAR = function(tokens) {
  let tmp = null;
  let token = peekToken(tokens);
  return (nichts_QUERY(token) ?
    undefined :
    (function() {
      let C__4;
      switch (token.name) {
        case "'":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return [
              symbol("quote"),
              read_STAR(tokens)
            ];
          });
          break;
        case "`":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return [
              symbol("quasiquote"),
              read_STAR(tokens)
            ];
          });
          break;
        case "~":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return [
              symbol("unquote"),
              read_STAR(tokens)
            ];
          });
          break;
        case "~@":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return [
              symbol("splice-unquote"),
              read_STAR(tokens)
            ];
          });
          break;
        case "^":
          C__4 = skip_PLUS_parse(tokens, function() {
            tmp = read_STAR(tokens);
            return [
              symbol("with-meta"),
              read_STAR(tokens),
              tmp
            ];
          });
          break;
        case "@":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return [
              symbol("deref"),
              read_STAR(tokens)
            ];
          });
          break;
        case "$":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return (function() {
              let y = read_STAR(tokens);
              let x = symbol("str");
              if ( (y.length > 1) ) {
                y = [
                  x,
                  y
                ];
              } else {
                y.unshift(x);
              }
              return y;
            }).call(this);
          });
          break;
        case "#":
          C__4 = skip_PLUS_parse(tokens, function() {
            let ____args = Array.prototype.slice.call(arguments);
            return [
              symbol("lambda"),
              read_STAR(tokens)
            ];
          });
          break;
        case ")":
          C__4 = throwE(token, "unexpected ')'");
          break;
        case "(":
          C__4 = readList(token, tokens);
          break;
        case "]":
          C__4 = throwE(token, "unexpected ']'");
          break;
        case "[":
          C__4 = readVector(token, tokens);
          break;
        case "}":
          C__4 = throwE(token, "unexpected '}'");
          break;
        case "{":
          C__4 = readMap(token, tokens);
          break;
        case ";":
        case ",":
          C__4 = (function() {
            let GS__5 = undefined;
            nextToken(tokens);
            return GS__5;
          }).call(this);
          break;
        default:
          C__4 = readAtom(tokens);
          break;
      }
      return C__4;
    }).call(this));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [addAst] in file: parser.ky,line: 371
const addAst = function(ast, f) {
  if ( (!(typeof (f) === "undefined")) ) {
    conj_BANG(ast, f);
  } else {
    null;
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [parser] in file: parser.ky,line: 375
//Main parser routine
const parser = function(source) {
  let GS__6 = Array.prototype.slice.call(arguments, 1);
  let fname = GS__6[0];
  let tokens = lexer(source, opt_QUERY__QUERY(fname, "*adhoc*"));
  let f = null;
  let ast = [];
  let tlen = kirbystdlibref.count(tokens);
  tokens.pos = 0;
  for (let ____break = false; ((!____break) && (tokens.pos < tlen));) {
    addAst(ast, read_STAR(tokens));
  }
  return ast;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [dumpTree] in file: parser.ky,line: 390
//Debug and dump the AST
const dumpTree = function(tree) {
  return (function() {
    for (let i = 0, sz = kirbystdlibref.count(tree), ____break = false; ((!____break) && (i < sz)); i = (i + 1)) {
      if (console) {
        console.log([
          prn(tree[i])
        ].join(""));
      }
    }
  }).call(this);
};
module.exports = {
  tnodeEx: tnodeEx,
  tnode: tnode,
  REGEX: REGEX,
  testid_QUERY: testid_QUERY,
  jsid: jsid,
  parser: parser,
  dumpTree: dumpTree
};