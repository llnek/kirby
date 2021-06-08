/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Copyright © 2013-2021, Kenneth Leung. All rights reserved. */
"use strict";
//////////////////////////////////////////////////////////////////////////////
const std = require("./stdlib");
const println=std["println"];
//////////////////////////////////////////////////////////////////////////////
class Token{
  constructor(source, line, column, value){
    this["source"] = source;
    this["value"] = value;
    this["line"] = line;
    this["column"] = column;
  }
  toString(){
    return this.value
  }
}
//////////////////////////////////////////////////////////////////////////////
function mkToken(source, line, col, chunk){
  return new Token(source, line, col, chunk)
}
//////////////////////////////////////////////////////////////////////////////
const REGEX={
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
//////////////////////////////////////////////////////////////////////////////
const REPLACERS=[
  [REGEX.query, "_QMRK_"],
  [REGEX.bang, "_BANG_"],
  [REGEX.dash, "_DASH_"],
  [REGEX.quote, "_QUOT_"],
  [REGEX.hash, "_HASH_"],
  [REGEX.plus, "_PLUS_"],
  [REGEX.perc, "_PERC_"],
  [REGEX.at, "_AT_"],
  [REGEX.less, "_LT_"],
  [REGEX.greater, "_GT_"],
  [REGEX.star, "_STAR_"]];
//////////////////////////////////////////////////////////////////////////////
function testid(name){
  return REGEX.id.test(name) || REGEX.id2.test(name)
}
//////////////////////////////////////////////////////////////////////////////
//Escape to compliant js identifier
function jsid(input){
  let pfx = "",
      name = `${input}`;
  if(name && name.startsWith("-")){
    pfx = "-";
    name = name.slice(1)
  }
  return !testid(name) ? `${pfx}${name}`
                       : REPLACERS.reduce((acc, x)=>{
                              acc=acc.replace(x[0], x[1]);
                              return acc.endsWith(x[1]) ? acc.slice(0, -1) : acc;
                         }, `${pfx}${name}`.replace(REGEX.slash, "."))
}
//////////////////////////////////////////////////////////////////////////////
//Lexical analyzer
function lexer(source, fname){
  let len = std.count(source);
  let comment_Q= false;
  let fform_Q= false;
  let esc_Q= false;
  let str_Q= false;
  let regex_Q= false;
  let token = "";
  let jsEsc = 0;
  let line = 1;
  let ch = null;
  let nx = null;
  let col = 0;
  let pos = 0;
  let tree = [];
  let tcol = col;
  let tline = line;
  function toke(ln, col, s, s_Q){
    if(std.opt_QMRK__QMRK(s_Q, std.not_DASH_empty(s))){
      if(s.startsWith("&") && s != "&&" && s.length>1){
        tree.push(mkToken(fname, ln, col, "&"));
        s=s.slice(1);
      }else if(s == "?"){
        s="undefined"
      }else if(s.startsWith("@@")){
        s=`this.${s.slice(2)}`
      }
      tree.push(mkToken(fname, ln, col, s))
    }
    return "";
  }
  /////
  while(pos < len){
    ch=source.charAt(pos);
    ++col;
    ++pos;
    nx=source.charAt(pos);
    if(ch == "\n"){
      col=0;
      ++line;
      if(comment_Q)
        comment_Q=false
    }
    if(comment_Q){
    }else if(esc_Q){
      esc_Q=false;
      token += ch;
    }else if(regex_Q){
      if(ch == "\\")
        esc_Q= true;
      token += ch;
      if(ch == "/"){
        regex_Q= false;
        if("gimuy".includes(nx)){
          token += nx;
          ++pos;
        }
        token = toke(tline, tcol, token);
      }
    }else if(fform_Q){
      if(ch == "`" && nx == "`" && source.charAt(pos+1) == "`"){
        fform_Q= false;
        pos += 2;
        token += "\"";
        token = toke(tline, tcol, token, true);
      }else if(ch == "\""){
        token += "\\\""
      }else if(ch == "\n"){
        token += "\\n"
      }else if(ch == "\\"){
        token += (nx == "n" ||nx == "r" || nx == "u" || nx == "t" || nx == "f" || nx == "v") ? ch : "\\\\"
      }else{
        token += ch
      }
    }else if(ch == "`" && nx == "`" && source.charAt(pos+1) == "`" && 0 === std.count(token)){
      tline = line;
      tcol = col;
      pos += 2;
      fform_Q= true;
      token += "\"";
    }else if(ch == "\""){
      if(!str_Q){
        tline = line;
        tcol = col;
        str_Q= true;
        token += ch;
      }else{
        str_Q= false;
        token += ch;
        token = toke(tline, tcol, token, true);
      }
    }else if(str_Q){
      if(ch == "\n")
        ch = "\\n"
      if(ch == "\\")
        esc_Q= true
      token += ch
    }else if(ch == "@" && nx == "@" && 0 === std.count(token)){
      tline = line;
      tcol = col;
      token += "@@";
      ++pos;
    }else if(ch == "`" && nx == "{"){
      token = toke(tline, tcol, token);
      tline = line;
      tcol = col;
      ++pos;
      toke(tline, tcol, "`{");
    }else if(ch == "'" || ch == "`" || ch == "$" || ch == "@" || ch == "^"){
      if(0 === std.count(token) && !REGEX.wspace.test(nx)){
        tline = line;
        tcol = col;
        toke(tline, tcol, ch);
      }else{
        token += ch
      }
    }else if(ch == "&" && nx == "&"){
      if(0 === std.count(token)){
        tline = line;
        tcol = col;
      }
      token += "&&";
      ++pos;
    }else if(ch == "~"){
      if(0 === std.count(token) && !REGEX.wspace.test(nx)){
        tline = line;
        tcol = col;
        if(nx == "@"){
          ++pos;
          toke(tline, tcol, "~@");
        }else{
          toke(tline, tcol, ch)
        }
      }else{
        token += ch
      }
    }else if(ch == "#" && nx == "/" && 0 === std.count(token)){
      regex_Q= true;
      tline = line;
      tcol = col;
      ++pos;
      token += "#/";
    }else if(ch == "#" && nx == "{"){
      token = toke(tline, tcol, token);
      tline = line;
      tcol = col;
      ++pos;
      toke(tline, tcol, "#{");
    }else if(ch == "[" || ch == "]" || ch == "{" || ch == "}" || ch == "(" || ch == ")"){
      token = toke(tline, tcol, token);
      tline = line;
      tcol = col;
      toke(tline, tcol, ch);
    }else if(ch == ";"){
      token = toke(tline, tcol, token);
      tline = line;
      tcol = col;
      comment_Q= true;
    }else if(ch == "," || REGEX.wspace.test(ch)){
      token = toke(ch == "\n" ? tline-1 : tline, tcol, token)
    }else{
      if(0 === std.count(token)){
        tline = line;
        tcol = col;
      }
      token += ch;
    }
  }
  ////
  const tmp={source: fname, line: tline, column:col};
  if(fform_Q)
    throwE(tmp, "unterminated free-form");
  if(esc_Q)
    throwE(tmp, "incomplete escape");
  if(str_Q)
    throwE(tmp, "unterminated string");
  if(regex_Q)
    throwE(tmp, "unterminated regex definition");
  return tree;
}
//////////////////////////////////////////////////////////////////////////////
//Raise an error
function throwE(token,...msgs){
  let s = msgs.join("");
  if(token)
    throw new Error([s, "\nnear line: ", token.line, "\nin file: ", token.source].join(""));
  else
    throw new Error([s, "\nnear EOF"].join(""));
}
//////////////////////////////////////////////////////////////////////////////
//Returns the next token,
//updates the token index
function popToken(tokens){
  const t = peekToken(tokens);
  ++tokens.pos;
  return t;
}
//////////////////////////////////////////////////////////////////////////////
//Returns the next token,
//without moving the token index
function peekToken(tokens){
  return tokens[tokens.pos]
}
//////////////////////////////////////////////////////////////////////////////
//Returns the previous token
function prevToken(tokens){
  return tokens[tokens.pos-1]
}
//////////////////////////////////////////////////////////////////////////////
//Attach source level information
//to the node
function copyTokenData(token, node){
  if(std.object_QMRK(node) ||
     Array.isArray(node) ||
     Object.prototype.toString.call(node) == "[object Map]" ||
     Object.prototype.toString.call(node) == "[object Set]"){
    node["source"] = token.source;
    node["line"] = token.line;
    node["column"] = token.column;
  }
  return node;
}
//////////////////////////////////////////////////////////////////////////////
//Process an atom
function readAtom(tokens){
  let token = popToken(tokens),
      ret = null,
      tn = token.value;
  if(0 === std.count(tn)){
    ret = undefined
  }else if(REGEX.float.test(tn)){
    ret = parseFloat(tn)
  }else if(REGEX.hex.test(tn) || REGEX.int.test(tn)){
    ret = parseInt(tn)
  }else if(tn.startsWith("\"") && tn.endsWith("\"")){
    ret = std.unquote_DASH_str(tn)
  }else if(tn.startsWith(":")){
    ret = std.keyword(tn)
  }else if(tn.startsWith("%")){
    ret = std.lambdaArg(tn)
  }else if(tn.startsWith("#/") && (tn.endsWith("/") || tn.slice(0, -1).endsWith("/"))){
    ret = std.regexObj(tn)
  }else if(tn == "nil" || tn == "null"){
    ret = null
  }else if(tn == "#t" || tn == "true"){
    ret = true
  }else if(tn == "#f" || tn == "false"){
    ret = false
  }else{
    ret = std.symbol(tn)
  }
  return copyTokenData(token, ret)
}
//////////////////////////////////////////////////////////////////////////////
//Process a LISP form
function readBlock(tokens, head, tail){
  let token = popToken(tokens),
      start = token,
      cur, ast = [], ok= true;
  if(token.value !== head)
    throwE(token, "expected '", head, "'");
  while(1){
    cur = peekToken(tokens);
    if(std.nichts_QMRK(cur)){
      throwE(start, "expected '", tail, "', got EOF")
    }else if(tail == cur.value){
      break;
    }else{
      addAst(ast, read_STAR(tokens))
    }
  }
  popToken(tokens);
  return copyTokenData(start, ast);
}
//////////////////////////////////////////////////////////////////////////////
//Process an expression
function readList(tokens){
  return readBlock(tokens, "(", ")")
}
//////////////////////////////////////////////////////////////////////////////
//Process a Vector
function readVector(tokens){
  return std.into_BANG("vector", readBlock(tokens, "[", "]"))
}
//////////////////////////////////////////////////////////////////////////////
//Process a ObjectMap
function readObjectMap(tokens){
  return std.into_BANG("map", readBlock(tokens, "{", "}"))
}
//////////////////////////////////////////////////////////////////////////////
//Process a Object
function readObject(tokens){
  return std.into_BANG("obj", readBlock(tokens, "`{", "}"))
}
//////////////////////////////////////////////////////////////////////////////
//Process a ObjectSet
function readObjectSet(tokens){
  return std.into_BANG("set", readBlock(tokens, "#{", "}"))
}
//////////////////////////////////////////////////////////////////////////////
//Process a JS Literal
function readJSLiteral(tokens){
  let c2,t=popToken(tokens) && peekToken(tokens);
  switch(t.value){
    case "{":
      c2 = std.into_BANG("obj", readBlock(tokens, "{", "}"));
      break;
    case "[":
      c2 = std.into_BANG("vector", readBlock(tokens, "[", "]"));
      break;
    default:
      throw new Error("bad use of #js");
  }
  return c2;
}
//////////////////////////////////////////////////////////////////////////////
//Advance the token index,
//then continue to parse
function skipParse(tokens, func){
  let t = popToken(tokens),
      ret = func(tokens),
      a1 = ret[0];
  copyTokenData(t, a1);
  return copyTokenData(t, ret);
}
//////////////////////////////////////////////////////////////////////////////
const SPEC_TOKENS={

  "'": function(a1){ return [std.symbol("quote"), read_STAR(a1)] },
  "`": function(a1){ return [std.symbol("syntax-quote"), read_STAR(a1)] },
  "~": function(a1){ return [std.symbol("unquote"), read_STAR(a1)] },
  "~@": function(a1){ return [std.symbol("splice-unquote"), read_STAR(a1)] },
  "@": function(a1){ return [std.symbol("deref"), read_STAR(a1)] },
  "#": function(a1){ return [std.symbol("lambda"), read_STAR(a1)] },
  "^": function(a1){ let t= read_STAR(a1); return [std.symbol("with-meta"), read_STAR(a1), t]},

  "[": [function(a1){ return readVector(a1) }],
  "(": [function(a1){ return readList(a1) }],
  "#js": [function(a1){ return readJSLiteral(a1) }],
  "#{": [function(a1){ return readObjectSet(a1) }],
  "`{": [function(a1){ return readObject(a1) }],
  "{": [function(a1){ return readObjectMap(a1) }],

  "$": function(a1){
    let x = std.symbol("str");
    let y = read_STAR(a1);
    if(y.length > 1){ y= [x, y] }else{ y.unshift(x) } return y; }
};
//////////////////////////////////////////////////////////////////////////////
//Inner parser routine
function read_STAR(tokens){
  let token = peekToken(tokens);
  let rc,tval= "";
  if(token)
    tval=token.value;
  let func = SPEC_TOKENS[tval];
  if(Array.isArray(func)){
    rc=func[0](tokens)
  }else if(typeof(func) == "function"){
    rc=skipParse(tokens, func)
  }else if(std.nichts_QMRK(token)){
  }else if(tval == ";" || tval == ","){
    popToken(tokens)
  }else{
    rc=readAtom(tokens)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function addAst(ast, f){
  if(typeof(f) != "undefined") ast.push(f);
  return ast;
}
//////////////////////////////////////////////////////////////////////////////
//Main parser routine
function parse(source,...args){
  let tokens = lexer(source, std.opt_QMRK__QMRK(args[0],"*adhoc*"));
  let tlen = std.count(tokens);
  let ast = [];

  if(false)
    tokens.forEach(function(a){ println("token=", a) })

  tokens.pos = 0;
  while(tokens.pos < tlen)
    addAst(ast, read_STAR(tokens));
  //console.log(dumpTree(ast));
  return ast;
}
//////////////////////////////////////////////////////////////////////////////
function dumpInfo(tag, ast){
  return ast && typeof(ast.line)== "number" ?
    `<${tag} line=\"${ast.line}\" column=\"${ast.column}\">` : `<${tag}>`;
}
//////////////////////////////////////////////////////////////////////////////
//Debug and dump the AST
function dump_STAR(tree){
  if(std.isPrimitive(tree)){ tree = tree.value }
  let s,rc;
  if(std.isVector(tree)){
    s=(tree || []).map(a=>dump_STAR(a)).join("");
    rc=`${dumpInfo("vector", tree)}${s}</vector>`
  }else if(std.isSet(tree)){
    s=(tree || []).map(x=>dump_STAR(x)).join("");
    rc=`${dumpInfo("set", tree)}${s}</set>`
  }else if(std.isMap(tree)){
    s=(tree || []).map(x=>dump_STAR(a)).join("");
    rc=`${dumpInfo("map", tree)}${s}</map>`
  }else if(std.isList(tree)){
    s=(tree || []).map(x=>dump_STAR(x)).join("");
    rc=`${dumpInfo("list", tree)}${s}</list>`
  }else if(Array.isArray(tree)){
    s=(tree || []).map(a=>dump_STAR(a)).join("");
    rc=`${dumpInfo("sexpr", tree)}${s}</sexpr>`
  }else if(std.isLambdaArg(tree)){
    rc=`${dumpInfo("lambda-arg", tree)}${tree.value}</lambda-arg>`
  }else if(std.isKeyword(tree)){
    rc=`${dumpInfo("keyword", tree)}${escXml(tree.value)}</keyword>`
  }else if(std.isSymbol(tree)){
    rc=`${dumpInfo("symbol", tree)}${escXml(tree.value)}</symbol>`
  }else if(std.isRegexObj(tree)){
    rc=`${dumpInfo("regex", tree)}${escXml(tree.value)}</regex>`
  }else if(typeof(tree)== "string"){
    rc=`<string>${escXml(std.quoteStr(tree))}</string>`
  }else if(typeof(tree) == "number"){
    rc=`<number>${tree}</number>`
  }else if(tree === null){
    rc=`<reserved>null</reserved>`
  }else if(tree === true){
    rc=`<boolean>true</boolean>`
  }else if(tree === false){
    rc=`<boolean>false</boolean>`
  }else if(typeof(tree) == "undefined"){
    rc=`<reserved>undefined</reserved>`
  }else{
    throwE(tree, "Bad AST")
  }
  return rc
}
//////////////////////////////////////////////////////////////////////////////
//Debug and dump the AST
function dumpTree(tree, fname){
  return `<AbstractSyntaxTree file=\"${escXml(fname)}\">${dump_STAR(tree)}</AbstractSyntaxTree>`
}
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.reader",
    vars: ["Token", "REGEX", "testid?", "jsid", "parse", "dumpTree"],
    macros: {}
  },
  Token: Token,
  REGEX: REGEX,
  testid: testid,
  jsid: jsid,
  parse: parse,
  dumpTree: dumpTree
};
//////////////////////////////////////////////////////////////////////////////
//EOF

