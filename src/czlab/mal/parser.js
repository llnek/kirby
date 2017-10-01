var printer=require("./printer"),
    types=require("./types"),
    rdr=require("./lexer"),
    path= require("path"),
    fs= require("fs");

//
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

//
function nextToken(tokens) {
  let t= tokens[tokens.pos];
  ++tokens.pos;
  return t;
}

//
function peekToken(tokens)  {
  return tokens[tokens.pos];
}

//
function copyTokenData (token, node) {
  if (node) {
    node.source= token.source;
    node.line= token.line;
    node.column= token.column;
  }
  return node;
}

//
function readAtom(tokens) {
  let token = nextToken(tokens), ret, tn="";
  if (token) tn = token.name;

  if (!tn || tn.length===0) { ret= undefined; }
  else if (rdr.REGEX.float.test(tn)) {
    ret=parseFloat(tn);
  }
  else if (rdr.REGEX.hex.test(tn) ||
           rdr.REGEX.int.test(tn)) {
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

//
function readBlock(tokens, head, tail) {
  let token= nextToken(tokens), ret, tn="";
  if (token) tn= token.name;

  if (tn !== head)
    throwE(token, "expected '" + head + "'");

  let ast=[], cur= peekToken(tokens);
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

//
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
  v.__ismap__=true;
  return v;//types._hash_map.apply(null, v);
}

function skipAndParse (tokens ,func) {
  let cur= nextToken(tokens);
  return copyTokenData(cur, func(tokens));
}

function readTokens (tokens) {
  let tmp=null, token= peekToken(tokens);

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

//
function addAst(ast, f) {
  if (typeof f !== "undefined") ast.push(f);
  return ast;
}

//
function parser (source, fname) {
  fname= fname || "**adhoc**";
  let tokens= rdr.lexer(source, fname),
      f, ast=[], tlen= tokens.length;
  tokens.pos=0;

  //for(var i=0;i<tokens.length;++i) { console.log("token="+tokens[i].name); }

  while (true) {
    f= readTokens(tokens);
    addAst(ast, f);
    if (tokens.pos < tlen) {
      //f=readTokens(tokens);
    } else {
      break;
    }
  }
  //dumpTree(ast);
  return ast;
}

//
function dumpTree (tree) {
  let obj= null,
       indent= arguments[1] || 0,
       pad = "".repeat(indent);
  for (var i=0; i < tree.length; ++i) {
    obj= tree[i];
    printer.println(printer._pr_str(obj));
  }
}

module.exports= {
  dumpTree: dumpTree,
  parser: parser
};



