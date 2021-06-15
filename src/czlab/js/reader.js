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
//Defining a lambda positional argument
class LambdaArg{
  constructor(arg){
    let name= arg == "%" ? "1" : arg.slice(1);
    let v = parseInt(name);
    if(!(v>0))
      throw new Error(`invalid lambda-arg ${arg}`);
    this.value = `%${v}`;
  }
  toString(){
    return this.value
  }
}
//////////////////////////////////////////////////////////////////////////////
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
  let comment_Q= false,
      fform_Q= false,
      esc_Q= false,
      str_Q= false,
      regex_Q= false,
      token = "",
      jsEsc = 0,
      line = 1,
      ch = null,
      nx = null,
      col = 0,
      pos = 0,
      tree = [],
      tcol = col,
      tline = line,
      len = source ? source.length : 0;
  function toke(ln, col, s, s_Q){
    if(s_Q || s){
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
  while(pos<len){
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
    }else if(ch == "`" && nx == "`" && source.charAt(pos+1) == "`" && 0 === token.length){
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
    }else if(ch == "@" && nx == "@" && 0 === token.length){
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
      if(0 === token.length && !REGEX.wspace.test(nx)){
        tline = line;
        tcol = col;
        toke(tline, tcol, ch);
      }else{
        token += ch
      }
    }else if(ch == "&" && nx == "&"){
      if(0 === token.length){
        tline = line;
        tcol = col;
      }
      token += "&&";
      ++pos;
    }else if(ch == "~"){
      if(0 === token.length && !REGEX.wspace.test(nx)){
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
    }else if(ch == "#" && nx == "/" && 0 === token.length){
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
      if(0 === token.length){
        tline = line;
        tcol = col;
      }
      token += ch;
    }
  }
  ////
  const tmp={source: fname, line: tline, column:col};
  if(fform_Q) throwE(tmp, "unterminated free-form");
  if(esc_Q) throwE(tmp, "incomplete escape");
  if(str_Q) throwE(tmp, "unterminated string");
  if(regex_Q) throwE(tmp, "unterminated regex definition");

  if(token.length>0){
    token = toke(tline, tcol, token);
  }

  return tree;
}
//////////////////////////////////////////////////////////////////////////////
//Raise an error
function throwE(token,...msgs){
  let s = msgs.join("");
  if(!token)
    throw new Error(`${s}\nnear EOF`);
  else
    throw new Error(`${s}\nnear line: ${token.line}\nin file: ${token.source}`);
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
//Attach source level information to the node
function copyTokenData(token, node){
  if(typeof(node)=="object" &&node){
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
  if(0 === tn.length){
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
    ret = new LambdaArg(tn)
  }else if(tn.startsWith("#/") && (tn.endsWith("/") || tn.slice(0, -1).endsWith("/"))){
    ret = new std.RegexObj(tn)
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
function readBlock(tokens, limits="()"){
  let token=popToken(tokens),
      ast=new std.SList(),
      ends=["(",")"],
      expr=false,
      cur,ok=true, start = token;
  if(limits=="#{}"){
    ends=["#{", "}"];
  }else if(limits=="{}"){
    ends=["{", "}"];
  }else if(limits=="[]"){
    ends=["[", "]"];
    ast=new std.vector();
  }else if(limits=="()"){
    expr=true;
  }
  if(token.value !== ends[0])
    throwE(token, "expected '", ends[0], "'");
  while(1){
    cur = peekToken(tokens);
    if(!cur){
      throwE(start, "expected '", ends[1], "', got EOF")
    }else if(ends[1] == cur.value){
      break;
    }else{
      addAst(ast, readAst(tokens))
    }
  }
  popToken(tokens);
  if(expr){
    if(std.symbol_QMRK(ast[0])){
      switch(`${ast[0]}`){
        case "hash-map":
          ast[0].value="hashmap*";
          break;
        case "hash-set":
          ast[0].value="hashset*";
          break;
        case "vector":
          ast[0].value="vector*";
          break;
        case "list":
          ast[0].value="list*";
          break;
        case "object":
          ast[0].value="object*";
          break;
      }
    }
  }else if(ends[0]=="#{"){
    ast.unshift(std.symbol("hashset*"))
  }else if(ends[0]=="{"){
    ast.unshift(std.symbol("hashmap*"))
  }
  return copyTokenData(start, ast);
}
//////////////////////////////////////////////////////////////////////////////
//Process an expression
function readList(tokens){
  return readBlock(tokens, "()")
}
//////////////////////////////////////////////////////////////////////////////
//Process a Vector
function readVector(tokens){
  return readBlock(tokens, "[]")
}
//////////////////////////////////////////////////////////////////////////////
//Process a ObjectMap
function readObjectMap(tokens){
  return readBlock(tokens, "{}")
}
//////////////////////////////////////////////////////////////////////////////
//Process a ObjectSet
function readObjectSet(tokens){
  return readBlock(tokens, "#{}")
}
//////////////////////////////////////////////////////////////////////////////
//Process a JS Literal
function readJSLiteral(tokens){
}
//////////////////////////////////////////////////////////////////////////////
//Advance the token index, then continue to parse
function skipParse(tokens, func){
  let t = popToken(tokens),
      ret = func(tokens),
      a1 = ret[0];
  return copyTokenData(t, a1) && copyTokenData(t, ret);
}
//////////////////////////////////////////////////////////////////////////////
const SPEC_TOKENS=(function(m){
  let o=new Map();
  Object.keys(m).forEach(k=>o.set(k,m[k]));
  return o;
})({

  "'": function(a1){ return [std.symbol("quote"), readAst(a1)] },
  "`": function(a1){ return [std.symbol("syntax-quote"), readAst(a1)] },
  "~": function(a1){ return [std.symbol("unquote"), readAst(a1)] },
  "~@": function(a1){ return [std.symbol("splice-unquote"), readAst(a1)] },
  "@": function(a1){ return [std.symbol("deref"), readAst(a1)] },
  "#": function(a1){ return [std.symbol("lambda"), readAst(a1)] },
  "^": function(a1){ let t= readAst(a1); return [std.symbol("with-meta"), readAst(a1), t]},

  "[": [function(a1){ return readVector(a1) }],
  "(": [function(a1){ return readList(a1) }],
  //"#js": [function(a1){ return readJSLiteral(a1) }],
  "#{": [function(a1){ return readObjectSet(a1) }],
  //"`{": [function(a1){ return readObject(a1) }],
  "{": [function(a1){ return readObjectMap(a1) }],

  "$": function(a1){
    let x = std.symbol("str");
    let y = readAst(a1);
    if(y.length > 1){ y= [x, y] }else{ y.unshift(x) } return y; }
});
//////////////////////////////////////////////////////////////////////////////
//Inner parser routine
function readAst(tokens){
  let rc,tval="",token = peekToken(tokens);
  if(token) tval=token.value;
  let func = SPEC_TOKENS.get(tval);
  if(Array.isArray(func)){
    rc=func[0](tokens)
  }else if(typeof(func) == "function"){
    rc=skipParse(tokens, func)
  }else if(tval == ";" || tval == ","){
    popToken(tokens)
  }else if(!token){
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
  let tokens = lexer(source, args[0] || "*adhoc*");
  let tlen = tokens.length;
  let ast = [];

  if(false)
    tokens.forEach(function(a){ println("token=", a) })

  tokens.pos = 0;
  while(tokens.pos < tlen)
    addAst(ast, readAst(tokens));
  //console.log(dumpAst(ast));
  return ast;
}
//////////////////////////////////////////////////////////////////////////////
function dumpInfo(tag, ast){
  return ast && typeof(ast.line)== "number" ?
    `<${tag} line=\"${ast.line}\" column=\"${ast.column}\">` : `<${tag}>`;
}
//////////////////////////////////////////////////////////////////////////////
//Debug and dump the AST
function dumpTree(tree){
  //if(std.primitive_QMRK(tree)){ tree = tree.value }
  let s,rc;
  if(tree instanceof std.SVec){
    //vector
    s=tree.map(a=>dumpTree(a)).join("");
    rc=`${dumpInfo("vector", tree)}${s}</vector>`
  }else if(tree instanceof std.SSet){
    //set
    s=tree.map(x=>dumpTree(x)).join("");
    rc=`${dumpInfo("set", tree)}${s}</set>`
  }else if(tree instanceof std.SMap){
    //map
    s=tree.map(x=>dumpTree(a)).join("");
    rc=`${dumpInfo("map", tree)}${s}</map>`
  }else if(tree instanceof std.SList){
    //list
    s=tree.map(x=>dumpTree(x)).join("");
    rc=`${dumpInfo("list", tree)}${s}</list>`
  }else if(Array.isArray(tree)){
    s=tree.map(a=>dumpTree(a)).join("");
    rc=`${dumpInfo("array", tree)}${s}</array>`
  }else if(tree instanceof LambdaArg){
    rc=`${dumpInfo("lambda-arg", tree)}${tree.value}</lambda-arg>`
  }else if(std.keyword_QMRK(tree)){
    rc=`${dumpInfo("keyword", tree)}${std.esc_DASH_xml(tree.value)}</keyword>`
  }else if(std.symbol_QMRK(tree)){
    rc=`${dumpInfo("symbol", tree)}${std.esc_DASH_xml(tree.value)}</symbol>`
  }else if(tree instanceof std.RegexObj){
    rc=`${dumpInfo("regex", tree)}${std.esc_DASH_xml(tree.value)}</regex>`
  }else if(typeof(tree)== "string"){
    rc=`<string>${std.esc_DASH_xml(std.quote_DASH_str(tree))}</string>`
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
    //rc=tree.toString();
    throwE(tree, "Bad AST")
  }
  return rc
}
//////////////////////////////////////////////////////////////////////////////
//Debug and dump the AST
function dumpAst(tree, fname){
  return `<AbstractSyntaxTree file=\"${std.esc_DASH_xml(fname)}\">${dumpTree(tree)}</AbstractSyntaxTree>`
}
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.reader",
    vars: ["Token", "REGEX", "testid?", "jsid", "parse", "dumpAst"],
    macros: {}
  },
  LambdaArg: LambdaArg,
  Token: Token,
  REGEX: REGEX,
  testid: testid,
  jsid: jsid,
  parse: parse,
  dumpAst: dumpAst
};
//////////////////////////////////////////////////////////////////////////////
//EOF

