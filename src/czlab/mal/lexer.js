var TreeNode= require("source-map").SourceNode,
  printer=require("./printer"),
  types=require("./types"),
  path= require("path"),
  fs= require("fs");

function tnode(source, line, col, chunk, name, type) {
  let argsQ = arguments.length > 0,
    n=null;

  if (argsQ) {
    if (name) {
      n=new TreeNode(line, col, source, chunk, name);
    } else {
      n=new TreeNode(line, col, source, chunk);
    }
  } else {
    n= new TreeNode();
  }

  return n;
}

function tnodeEx(chunk, name, type) {
  return tnode(null,null,null,chunk, name, type);
}

function regex(s,glim) {return new RegExp(s,glim);}
var REGEX= {
  noret: regex("^def\\b|^var\\b|^set!\\b|^throw\\b"),
  id: regex("^[a-zA-Z_$][?\\-*!0-9a-zA-Z_'<>#@$]*$"),
  id2: regex("^[*\\-][?\\-*!0-9a-zA-Z_'<>#@$]+$"),
  float: regex( "^[-+]?[0-9]+\\.[0-9]+$"),
  int: regex("^[-+]?[0-9]+$"),
  hex: regex("^[-+]?0x"),
  macroGet: regex("^#slice@(\\d+)"),
  dquoteHat: regex("^\""),
  dquoteEnd: regex("\"$"),
  func: regex("^function\\b"),
  query: regex( "\\?" ,"g"),
  bang: regex( "!", "g"),
  dash: regex( "-", "g"),
  quote: regex( "'", "g"),
  hash: regex( "#", "g"),
  at: regex( "@", "g"),
  less: regex( "<", "g"),
  greater: regex( ">", "g"),
  star: regex( "\\*", "g"),
  wspace: regex("\\s") };

function testid_Q (name) {
  return REGEX.id.test(name) || REGEX.id2.test(name);
}

function jsid (name) { return normalizeId(name); }
function normalizeId (name) {
}

function throwE(token, msg) {
  if (token) {
    msg = msg +
          "\nnear line " + token.line +
          "\nin file " +  token.source;
  } else {
    msg = msg + "\nnear EOF ";
  }
  throw new Error(msg);
}

function nextToken(tokens) {
  let t= tokens[tokens.pos];
  ++tokens.pos;
  return t;
}

function peekToken(tokens)  {
  return tokens[tokens.pos];
}

function copyTokenData (token, node) {
  if (node) {
    node.source= token.source;
    node.line= token.line;
    node.column= token.column;
  }
  return node;
}

function readAtom(tokens) {
  let token = nextToken(tokens),
    ret,
    tn="";
  if (token) tn = token.name;

  if (!tn || tn.length===0) { ret= undefined; }
  else if (REGEX.float.test(tn)) {
    ret=parseFloat(tn);
  }
  else if (REGEX.hex.test(tn) ||
           REGEX.int.test(tn)) {
    ret=parseInt(tn);
  }
  else if (tn.startsWith("\"") &&
    tn.endsWith("\"")) {
    ret=tn;
    ret=tn.slice(1,tn.length-1)
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n")
            .replace(/\\\\/g, "\\");
  }
  else if (tn.startsWith(":")) {
    ret= types._keyword(tn);
  }
  else if ("nil"=== tn ||
           "null"=== tn)  {
    ret= null;
  }
  else if ("true" === tn) {
    ret=true;
  }
  else if ("false"=== tn) {
    ret=false;
  }
  else {
    ret =types._symbol(tn);
  }

  return copyTokenData(token,ret);
}

function readBlock(tokens, head, tail) {
  let token= nextToken(tokens),
    ret,
    tn="";
  if (token) tn= token.name;

  if (tn !== head)
    throwE(token, "expected '" + head + "'");

  let ast=[],
      cur= peekToken(tokens);
  while (true) {
    if (!cur || (tail === cur.name)) {
      if (cur) {
        copyTokenData(token, ast);
      } else {
        throwE(cur, "expected '"+ tail+ "', got EOF");
      }
      break;
    }
    addAst(ast, readTokens(tokens));
    cur=peekToken(tokens);
  }
  nextToken(tokens);
  return ast;
}

function readList(cur, tokens) {
  let v=readBlock(tokens, "(", ")");
  return v;
}

function readVector(cur, tokens) {
  let v=readBlock(tokens, "[", "]");
  v.__isvector__=true;
  return v;
}

function readObject (cur, tokens) {
  let v= readBlock(tokens, "{",  "}");
  return v;
}

function skipAndParse (tokens ,func) {
  let cur= nextToken(tokens);
  return copyTokenData(cur, func(tokens));
}

function readTokens (tokens) {
  let tmp=null,
       token= peekToken(tokens);

  if (! token) { return undefined; }
  switch (token.name) {
    case "'": return skipAndParse(tokens,
                        function () {
                          return
                          [types._symbol("quote"),
                           readTokens(tokens)];});
    case "`": return skipAndParse(tokens,
                        function () {
                          return [types._symbol("quasiquote"),
                                  readTokens(tokens)];});
    case "~": return skipAndParse(tokens,
                        function () {
                          return [types._symbol("unquote"),
                                  readTokens(tokens)];});
    case "~@": return skipAndParse(tokens,
                         function(){
                           return [types._symbol("splice-unquote"),
                             readTokens(tokens)];});
    case "^": return skipAndParse(tokens,
                        function () {
                          tmp= readTokens(tokens);
                           return [types._symbol("with-meta"),
                            readTokens(tokens), tmp];});
    case "@": return skipAndParse(tokens,
                        function(){
                          return [types._symbol("deref"),
                            readTokens(tokens)];});
    case ")": throwE(token, "unexpected ')'");
    case "(": return readList(token, tokens);
    case "]": throwE(token, "unexpected ']'");
    case "[": return readVector(token, tokens);
    case "}": throwE(token, "unexpected '}'");
    case "{": return readObject(token, tokens);
    case ";":
    case ",": nextToken(tokens); return undefined;
    default:
      return readAtom(tokens);
  }
}

function addAst(ast, f) {
  if (typeof f !== "undefined") ast.push(f);
  return ast;
}

function read_str(s) {
  return parser(s, "**adhoc**");
}

function parser (source, fname) {
  let tokens= tokenize(source, fname),
    f, ast=[],
       tlen= tokens.length;
  tokens.pos=0;

  for(var i=0;i<tokens.length;++i) { console.log("token="+tokens[i].name); }

  while (true) {
    f= readTokens(tokens);
    addAst(ast, f);
    if (tokens.pos < tlen) {
      f=readTokens(tokens);
    } else {
      break;
    }
  }
  //dumpTree(ast);
  return ast.length ===1 ? ast[0] : ast;
}

function tokenize (source, fname) {
  let len= source.length,
       token= "",
       line= 1,
       tcol= 0,
       col= 0,
       pos= 0,
       ch= null,
       nx= null,
       escQ= false,
       strQ= false,
    tree=[],
       commentQ= false;

  let toke=function(ln, col, s,astring) {
    if (astring || s.length > 0) {
     tree.push(tnode(fname, ln, col, s, s));
    }
    return "";
  }
  while (pos < len) {
    ch= source.charAt(pos);
    ++col;
    ++pos;
    nx= source.charAt(pos);
    if (ch=== "\n") {
      col= 0;
      ++line;
      if (commentQ) commentQ=false;
    }

    if (commentQ) {}
    else if (escQ) {
        escQ=false;
        token += ch;
    }
    else if (ch === "\"") {
      if (!strQ) {
          tcol= col;
              strQ=true;
              token += ch;
      } else {
        strQ=false;
        token += ch;
        token= toke(line, tcol, token, true);
      }
    }
    else if (strQ) {
        //if ( ch=== "\n") ch= "\\n";
        if ( ch=== "\\") escQ= true;
            token += ch;
    }
    else if ((ch=== "'") || (ch=== "`") ||
             (ch=== "@") || ( ch=== "^")) {
      if (token.length===0 &&
          (!REGEX.wspace.test(nx))) {
          tcol= col;
              toke(line, tcol, ch);
      } else {
          token += ch;
      }
    }
    else if (ch === "~") {
      if (token.length===0 &&
          (!REGEX.wspace.test(nx))) {
          tcol= col;
              if (nx=== "@") {
                ++pos;
                toke(line, tcol, "~@");
              } else {
                toke(line, tcol, ch);
              }
        } else {
          token += ch;
        }
    }
    else if ((ch=== "[") || (ch=== "]") ||
            (ch=== "{") || (ch=== "}") ||
      (ch=== "(") || (ch=== ")")) {
        token= toke(line, tcol, token);
            tcol= col;
            toke(line, tcol, ch);
    }
    else if (ch === ";") {
        token= toke(line, tcol, token);
            tcol= col;
            commentQ= true;
    }
    else if ((ch=== ",") ||
      REGEX.wspace.test(ch)) {
      let n=line;
      if (ch==="\n") n=line-1;
        token= toke( n, tcol, token);
    }
    else {
        if (token.length===0) tcol= col;
            token += ch;
    }
  }
  return tree;
}

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
function dumpTree (tree) {
  let obj= null,
       indent= arguments[1] || 0,
       pad = "".repeat(indent);

  for (var i=0; i < tree.length; ++i) {
    obj= tree[i];
    printer.println(printer._pr_str(obj));
  }
}

exports.dumpTree=dumpTree;
exports.parser=parser;
exports.read_str=read_str;



