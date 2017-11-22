/*Auto generated by Kirby - v1.0.0 czlab.kirby.bl.lexer Wed Nov 22 2017 18:37:46 GMT+1100 (AEDT)*/

const smap = require("source-map");
const std = require("./stdlib");
const contains_QUERY = std["contains_QUERY"];
const count = std["count"];
const opt_QUERY__QUERY = std["opt_QUERY__QUERY"];
const conj_BANG = std["conj_BANG"];
const list = std["list"];
const not_DASH_empty = std["not_DASH_empty"];
const kirbystdlibref = std;
//Create a token
const tnodeEx = function(chunk, name) {
  return tnode(null, null, null, chunk, name);
}
//Create a token
//with source information
const tnode = function() {
  let G____3 = Array.prototype.slice.call(arguments, 0);
  let source = G____3[0];
  let line = G____3[1];
  let col = G____3[2];
  let chunk = G____3[3];
  let name = G____3[4];
  return new smap.SourceNode(line, col, source, chunk, opt_QUERY__QUERY(name, ""));
}
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
const REPLACERS = [[REGEX.query, "_QUERY_"], [REGEX.bang, "_BANG_"], [REGEX.dash, "_DASH_"], [REGEX.quote, "_QUOTE_"], [REGEX.hash, "_HASH_"], [REGEX.plus, "_PLUS_"], [REGEX.perc, "_PERC_"], [REGEX.at, "_AT_"], [REGEX.less, "_LT_"], [REGEX.greater, "_GT_"], [REGEX.star, "_STAR_"]];
//Returns true
//if a valid js identifier
const testid_QUERY = function(name) {
  return (REGEX.id.test(name) || REGEX.id2.test(name));
}
//Escape to
//compliant js identifier
const jsid = function(name) {
  let pfx = "";
  if ( ((typeof (name) === "string") && ("-" === name.charAt(0))) ) {
    (pfx = "-", name = name.slice(1));
  }
  return (testid_QUERY(name) ?
    REPLACERS.reduce(function(acc, x) {
      acc = acc.replace(x[0], x[1]);
      return (acc.endsWith(x[1]) ?
        acc.slice(0, -1) :
        acc);
    }, [pfx, name].join("").replace(REGEX.slash, ".")) :
    ((pfx === "") ?
      name :
      [pfx, name].join("")));
}
//Lexical analyzer
const lexer = function(source, fname) {
  let len = count(source);
  let tree = [];
  let ch = null;
  let nx = null;
  let token = "";
  let line = 1;
  let esc_QUERY = false;
  let str_QUERY = false;
  let tcol = 0;
  let col = 0;
  let pos = 0;
  let regex_QUERY = false;
  let comment_QUERY = false;
  let toke = function(ln, col, s, s_QUERY) {
    if (opt_QUERY__QUERY(s_QUERY, (!(0 === kirbystdlibref.count(s))))) {
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
            token = toke(line, tcol, token);
          }
        } else {
          if ( (ch === "\"") ) {
            if ( (!str_QUERY) ) {
              tcol = col;
              str_QUERY = true;
              token += ch;
            } else {
              str_QUERY = false;
              token += ch;
              token = toke(line, tcol, token, true);
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
              if ( ((ch === "'") || (ch === "`") || (ch === "$") || (ch === "@") || (ch === "^")) ) {
                if ( ((0 === kirbystdlibref.count(token)) && (!REGEX.wspace.test(nx))) ) {
                  tcol = col;
                  toke(line, tcol, ch);
                } else {
                  token += ch;
                }
              } else {
                if ( ((ch === "&") && (nx === "&")) ) {
                  if ( (0 === kirbystdlibref.count(token)) ) {
                    tcol = col;
                  }
                  token += [ch, nx].join("");
                  ++pos;
                } else {
                  if ( (ch === "~") ) {
                    if ( ((0 === kirbystdlibref.count(token)) && (!REGEX.wspace.test(nx))) ) {
                      tcol = col;
                      if ( (nx === "@") ) {
                        ++pos;
                        toke(line, tcol, "~@");
                      } else {
                        toke(line, tcol, ch);
                      }
                    } else {
                      token += ch;
                    }
                  } else {
                    if ( ((ch === "/") && (0 === kirbystdlibref.count(token))) ) {
                      regex_QUERY = true;
                      tcol = col;
                      token += ch;
                    } else {
                      if ( ((ch === "[") || (ch === "]") || (ch === "{") || (ch === "}") || (ch === "(") || (ch === ")")) ) {
                        (token = toke(line, tcol, token), tcol = col);
                        toke(line, tcol, ch);
                      } else {
                        if ( (ch === ";") ) {
                          (token = toke(line, tcol, token), tcol = col, comment_QUERY = true);
                        } else {
                          if ( ((ch === ",") || REGEX.wspace.test(ch)) ) {
                            token = toke(((ch === "\n") ?
                              (line - 1) :
                              line), tcol, token);
                          } else {
                            if (true) {
                              if ( (0 === kirbystdlibref.count(token)) ) {
                                tcol = col;
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
  return tree;
}
module.exports = {
  tnodeEx: tnodeEx,
  tnode: tnode,
  REGEX: REGEX,
  testid_QUERY: testid_QUERY,
  jsid: jsid,
  lexer: lexer
};