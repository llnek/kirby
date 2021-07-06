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
const std = require("./kernel");
const println=std["println"];
//////////////////////////////////////////////////////////////////////////////
class Token{
  constructor(source, line, column, value){
    this["source"] = source;
    this["value"] = value;
    this["line"] = line;
    this["column"] = column;
  }
  toString(){ return this.value }
}
//////////////////////////////////////////////////////////////////////////////
//Defining a lambda positional argument
class LambdaArg extends std.SValue{
  constructor(token){
    super((function(){
      let name= token.value == "%" ? "1" : token.value.slice(1);
      let v = parseInt(name);
      if(!(v>0))
        throw Error(`invalid lambda-arg ${token.value}`);
      return `%${v}`;
    })());
  }
}
//////////////////////////////////////////////////////////////////////////////
function mkToken(src, ln, col, txt){ return new Token(src, ln, col, txt) }
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
  dollar: /\$/g,
  less: /</g,
  greater: />/g,
  star: /\*/g,
  wspace: /\s/
};
//////////////////////////////////////////////////////////////////////////////
const REPLACERS=[
  [REGEX.dollar, "_DOLA_"],
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
  return REGEX.id.test(name) || REGEX.id2.test(name) }
//////////////////////////////////////////////////////////////////////////////
/**Escape to compliant js identifier */
function jsid(input){
  let pfx = "",
      name = `${input}`;
  if(name && name.startsWith("-")){
    name = name.slice(1)
    pfx = "-";
  }
  return !testid(name) ? `${pfx}${name}`
                       : REPLACERS.reduce((acc, x)=> acc.replace(x[0], x[1]),
                                          `${pfx}${name}`.replace(REGEX.slash, ".")) }
//////////////////////////////////////////////////////////////////////////////
/**Lexical analyzer */
function lexer(source, fname){
  let commentQ= false, fformQ= false, escQ= false, strQ= false, regexQ= false;
  let token = "", jsEsc = 0, ch = null, nx = null, line=1;
  let col = 0, pos = 0, tree = [], tcol = col, tline = line, len = source ? source.length : 0;
  function consec3(t){ return ch == t && nx == t && source.charAt(pos+1) == t }
  function consec2(t){ return ch == t && nx == t }
  function multi(line,col,...ts){ ts.forEach(t=> toke(line,col,t,true)) }
  function toke(ln, col, s, sQ){
    if(sQ || s){
      if(s.startsWith("&") && s != "&&" && s.length>1){
        //turn &xs into 2 tokens [& and xs]
        tree.push(mkToken(fname, ln, col, "&"));
        s=s.slice(1);
      }else if(s.startsWith("@@")){
        //short-hand for this.xxx
        s=`this.${s.slice(2)}`
      }
      tree.push(mkToken(fname, ln, col, s))
    }
    return "";
  }
  /////here we go
  while(pos<len){
    ch=source.charAt(pos);
    (++col, ++pos);
    nx=source.charAt(pos);
    if(ch == "\n"){
      col=0;
      ++line;
      if(commentQ)
        commentQ=false
    }
    if(commentQ){
      //wait till EOL
    }else if(escQ){
      escQ=false;
      token += ch;
    }else if(regexQ){
      if(ch == "\\")
        escQ= true;
      token += ch;
      if(ch == "/"){
        regexQ= false;
        if("gimuy".includes(nx)){
          token += nx;
          ++pos;
        }
        token = toke(tline, tcol, token);
      }
    }else if(fformQ){
      if(consec3("`") || consec3('"')){
        fformQ= false;
        pos += 2;
        token += "\"";
        if(ch=="`"){
          multi(tline,tcol,"(", "raw#", token,")")
        }else{
          toke(tline, tcol, token, true)
        }
        token="";
      }else if(ch == "\""){
        token += "\\\""
      }else if(ch == "\n"){
        token += "\\n"
      }else if(ch == "\\"){
        token += (nx == "n" ||nx == "r" || nx == "u" || nx == "t" || nx == "f" || nx == "v") ? ch : "\\\\"
      }else{
        token += ch
      }
    }else if(!token && (consec3("`") || consec3('"'))){
      tline = line;
      tcol = col;
      pos += 2;
      fformQ= true;
      token += "\"";
    }else if(!token && !strQ && ch == "\""){
      tline = line;
      tcol = col;
      strQ= true;
      token += ch;
    }else if(strQ && ch=="\""){
      strQ= false;
      token += ch;
      token = toke(tline, tcol, token, true);
    }else if(strQ){
      if(ch == "\n") ch = "\\n";
      if(ch == "\\") escQ= true;
      token += ch;
    }else if(!token && consec2("@")){
      tline = line;
      tcol = col;
      token += "@@";
      ++pos;
    }else if(ch == "'" || ch == "`" ||
             ch == "$" || ch == "@" || ch == "^"){
      if(!token && !REGEX.wspace.test(nx)){
        tline = line;
        tcol = col;
        toke(tline, tcol, ch);
      }else{
        token += ch
      }
    }else if(consec2("&")){
      if(!token){
        tline = line;
        tcol = col;
      }
      token += "&&";
      ++pos;
    }else if(ch == "~"){
      if(!token && !REGEX.wspace.test(nx)){
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
    }else if(!token && ch == "#" && nx == "/"){
      regexQ= true;
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
    }else if(ch == "[" || ch == "]" ||
             ch == "{" || ch == "}" ||
             ch == "(" || ch == ")"){
      token = toke(tline, tcol, token);
      tline = line;
      tcol = col;
      toke(tline, tcol, ch);
    }else if(ch == ";"){
      token = toke(tline, tcol, token);
      tline = line;
      tcol = col;
      commentQ= true;
    }else if(ch == "," || REGEX.wspace.test(ch)){
      token = toke(ch == "\n" ? tline-1 : tline, tcol, token)
    }else{
      if(!token){
        tline = line;
        tcol = col;
      }
      token += ch;
    }
  }
  ////
  const tmp={source: fname, line: tline, column:col};
  if(fformQ) throwE(tmp, "unterminated free-form");
  if(escQ) throwE(tmp, "incomplete escape");
  if(strQ) throwE(tmp, "unterminated string");
  if(regexQ) throwE(tmp, "unterminated regex definition");

  //maybe deal with the very last token?
  if(token.length>0)
    token = toke(tline, tcol, token);

  return {tokens:tree,pos:0};
}
//////////////////////////////////////////////////////////////////////////////
/**Raise an error */
function throwE(token,...msgs){
  let s = msgs.join("");
  throw Error(!token ? `${s} near EOF` : `${s} near line: ${token.line}`) }
//////////////////////////////////////////////////////////////////////////////
/**Returns the next token, updates the token index */
function popToken(tree){
  const t = peekToken(tree);
  ++tree.pos;
  return t;
}
//////////////////////////////////////////////////////////////////////////////
/**Returns the next token, without moving the token index */
function peekToken(tree){ return tree.tokens[tree.pos] }
//////////////////////////////////////////////////////////////////////////////
/**Returns the previous token */
function prevToken(tree){ return tree.tokens[tree.pos-1] }
//////////////////////////////////////////////////////////////////////////////
/**Attach source level information to the node */
function copyTokenData(token, node){
  if(node && (Array.isArray(node)||
              std.rtti(node)=="[object Object]")){
    node["source"] = token.source;
    node["column"] = token.column;
    node["line"] = token.line;
  }
  return node;
}
//////////////////////////////////////////////////////////////////////////////
/**Process an atom */
function readAtom(tree){
  let token = popToken(tree),
      ret = null, tn = token.value;
  if(0 === tn.length){
    //ret = undefined
  }else if(REGEX.float.test(tn)){
    ret = parseFloat(tn)
  }else if(REGEX.hex.test(tn) || REGEX.int.test(tn)){
    ret = parseInt(tn)
  }else if(tn.startsWith("\"") && tn.endsWith("\"")){
    ret = std.unquoteStr(tn)
  }else if(tn.startsWith(":")){
    ret = std.keyword(tn)
  }else if(tn.startsWith("%")){
    ret = new LambdaArg(token)
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
/**Process a LISP form */
function readBlock(tree, ends){
  let ast=std.pair(), token=popToken(tree);
  let cur, jso=0, expr=0, ok=1, start = token;

  if(ends[0]=="["){ ast=std.vector() }
  if(ends[0]=="("){ expr=true }

  if(token.value !== ends[0])
    throwE(token, "expected '", ends[0], "'");

  while(1){
    cur = peekToken(tree);
    if(!cur)
      throwE(start, "expected '", ends[1], "', got EOF");
    if(ends[1] == cur.value){
      break;
    }
    addAst(ast, readAst(tree))
  }
  //get rid of the last token
  popToken(tree);
  if(jso){
    ast.unshift(std.symbol("object*"));
  }else if(expr){
    if(std.isSymbol(ast[0])){
      switch(`${ast[0]}`){
        case "hash-map": ast[0].value="hashmap*"; break;
        case "hash-set": ast[0].value="hashset*"; break;
        case "list": ast[0].value="list*"; break;
        case "vec": case "vector": ast[0].value="vector*"; break;
        case "js-obj": case "object": ast[0].value="object*"; break;
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
/**Advance the token index, then continue to parse */
function skipParse(tree, func){
  return copyTokenData(popToken(tree), func(tree)) }
//////////////////////////////////////////////////////////////////////////////
function rspec(s){
  return function(a){ return std.pair(std.symbol(s), readAst(a)) } }
//////////////////////////////////////////////////////////////////////////////
function group(x,y){
  return [function(a){ return readBlock(a, [x,y]) } ] }
//////////////////////////////////////////////////////////////////////////////
const SPEC_TOKENS=(function(m){
  let o=new Map();
  Object.keys(m).forEach(k=>o.set(k,m[k]));
  return o;
})({

  "^": function(a1){
         let t= readAst(a1);
         return std.pair(std.symbol("with-meta"), readAst(a1), t)},

  "~@": rspec("splice-unquote"),
  "'": rspec("quote"),
  "`": rspec("syntax-quote"),
  "~": rspec("unquote"),
  "@": rspec("deref"),
  "#": rspec("lambda"),

  "[": group("[","]"),
  "(": group("(",")"),
  "#{": group("#{","}"),
  "{": group("{","}")

});
//////////////////////////////////////////////////////////////////////////////
/**Inner parser routine */
function readAst(tree){
  let rc,tval="",token = peekToken(tree);
  if(token) tval=token.value;
  let func = SPEC_TOKENS.get(tval);
  if(Array.isArray(func)){
    rc=func[0](tree)
  }else if(typeof(func) == "function"){
    rc=skipParse(tree, func)
  }else if(tval == ";" || tval == ","){
    popToken(tree)
  }else if(!token){
  }else{
    rc=readAtom(tree)
  }
  return rc;
}
//////////////////////////////////////////////////////////////////////////////
function addAst(ast, f){
  if(typeof(f) != "undefined") ast.push(f);
  return ast;
}
//////////////////////////////////////////////////////////////////////////////
/**Main parser routine */
function parse(source,...args){
  let tree = lexer(source, args[0] || "*adhoc*");
  let tlen = tree.tokens.length;
  let ast = [];

  if(false)
    tree.tokens.forEach(a=> println("token=", a));

  tree.pos = 0;
  while(tree.pos < tlen)
    addAst(ast, readAst(tree));

  return ast;
}
//////////////////////////////////////////////////////////////////////////////
function xdump(tag, ast){
  return ast && typeof(ast.line)== "number" ?
    `<${tag} line=\"${ast.line}\" col=\"${ast.column}\">` : `<${tag}>` }
//////////////////////////////////////////////////////////////////////////////
/**Debug and dump the AST */
function dumpTree(tree){
  let s,rc;
  if(std.isVec(tree)){
    s=tree.map(a=>dumpTree(a)).join("");
    rc=`${xdump("vec", tree)}${s}</vec>`
  }else if(tree instanceof Set){
    s="";
    tree.forEach(v=>{
      if(s) s+=",";
      s+=dumpTree(v);
    });
    rc=`${xdump("set", tree)}${s}</set>`
  }else if(tree instanceof Map){
    s="";
    tree.forEach((v,k)=>{
      if(s) s += ",";
      s += dumpTree(k);
      s += ","
      s += dumpTree(v);
    });
    rc=`${xdump("map", tree)}${s}</map>`
  }else if(std.isPair(tree)){
    s=tree.map(a=>dumpTree(a)).join("");
    rc=`${xdump("list", tree)}${s}</array>`
  }else if(Array.isArray(tree)){
    s=tree.map(a=>dumpTree(a)).join("");
    rc=`${xdump("array", tree)}${s}</array>`
  }else if(tree instanceof LambdaArg){
    rc=`${xdump("lambda-arg", tree)}${tree.value}</lambda-arg>`
  }else if(std.isKeyword(tree)){
    rc=`${xdump("keyword", tree)}${std.escXml(tree.value)}</keyword>`
  }else if(std.isSymbol(tree)){
    rc=`${xdump("symbol", tree)}${std.escXml(tree.value)}</symbol>`
  }else if(tree instanceof std.RegexObj){
    rc=`${xdump("regex", tree)}${std.escXml(tree.value)}</regex>`
  }else if(typeof(tree)== "string"){
    rc=`<string>${std.escXml(std.quoteStr(tree))}</string>`
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
/**Debug and dump the AST */
function dumpAst(tree, fname){
  return `<AST file=\"${std.escXml(fname)}\">${dumpTree(tree)}</AST>` }
//////////////////////////////////////////////////////////////////////////////
/**Dump AST to xml */
function dbgAST(source, fname){
  return dumpAst(rdr.parse(source, fname), fname) }
//////////////////////////////////////////////////////////////////////////////
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.reader",
    vars: ["Token", "REGEX", "testid?", "jsid", "parse", "dbgAST"],
    macros: {}
  },
  LambdaArg,
  Token,
  REGEX,
  testid,
  jsid,
  parse,
  dbgAST
};
//////////////////////////////////////////////////////////////////////////////
//EOF

