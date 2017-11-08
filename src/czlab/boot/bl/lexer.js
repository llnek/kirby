// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var tn=require("./tnode"),
    std=require("./stdlib"),
    tnode=tn.tnode,
    tnodeEx=tn.tnodeEx;

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function regex(s,glim) {return new RegExp(s,glim);}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var REGEX= {
  //noret: regex("^def\\b|^var\\b|^set!\\b|^throw\\b"),
  noret: /^def\b|^var\b|^set!\b|^throw\b/,
  //id: regex("^[a-zA-Z_$][.?\\-*!0-9a-zA-Z_'<>#@$]*$"),
  id: /^[a-zA-Z_$][/.?\-*!0-9a-zA-Z_'<>%#@$\+]*$/,
  //id2: regex("^[*\\-][.?\\-*!0-9a-zA-Z_'<>#@$]+$"),
  id2: /^[*\-][/.?\-*!0-9a-zA-Z_'<>%#@$\+]+$/,
  //float: regex("^[-+]?[0-9]+\\.[0-9]+$"),
  float: /^[-+]?[0-9]+\.[0-9]+$/,
  //int: regex("^[-+]?[0-9]+$"),
  int: /^[-+]?[0-9]+$/,
  //hex: regex("^[-+]?0x"),
  hex: /^[-+]?0x/,
  //dquoteHat: regex("^\""),
  dquoteHat: /^"/,
  //dquoteEnd: regex("\"$"),
  dquoteEnd: /"$/,
  perc: /%/g,
  //func: regex("^function\\b"),
  func: /^function\b/,
  //query: regex( "\\?" ,"g"),
  query: /\?/g,
  //bang: regex( "!", "g"),
  bang: /!/g,
  //dash: regex( "-", "g"),
  dash: /-/g,
  plus: /\+/g,
  //quote: regex( "'", "g"),
  quote: /'/g,
  //hash: regex( "#", "g"),
  hash: /#/g,
  slash: /\//g,
  //at: regex( "@", "g"),
  at: /@/g,
  //less: regex( "<", "g"),
  less: /</g,
  //greater: regex( ">", "g"),
  greater: />/g,
  //star: regex( "\\*", "g"),
  star: /\*/g,
  //wspace: regex("\\s")
  wspace: /\s/ };

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function testid_Q (name) {
  return REGEX.id.test(name) || REGEX.id2.test(name);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function normalizeId (name) {
  let pfx= "";
  if (std.string_p(name) &&
      "-" === name.charAt(0)) {
    pfx= "-";
    name= name.slice(1);
  }

  if (testid_Q(name)) {
    name= (pfx+name).replace(REGEX.query, "_QUERY_").
        replace(REGEX.bang, "_BANG_").
        replace(REGEX.slash, ".").
        replace(REGEX.dash, "_DASH_").
        replace(REGEX.quote, "_QTE_").
        replace(REGEX.hash, "_HASH_").
        replace(REGEX.plus, "_PLUS_").
        replace(REGEX.perc, "_PERC_").
        replace(REGEX.at, "_AT_").
        replace(REGEX.less, "_LT_").
        replace(REGEX.greater, "_GT_").
        replace(REGEX.star, "_STAR_");
    ["_QUERY_" , "_BANG_" , "_DASH_" , "_QTE_" , "_HASH_" ,
      "_PLUS_" , "_PERC_" , "_AT_" ,
      "_LT_" , "_GT_" , "_STAR_"].forEach(function(s){
        if (name.endsWith(s)) {
          name=name.slice(0,-1);
        }
      });
    return name;
  } else {
    return (pfx === "") ? name : pfx+ name;
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
       regexQ=false,
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
    else if (regexQ) {
      if (ch === "\\") { escQ= true; }
      token += ch;
      if (ch === "/") {
        regexQ=false;
        if ("gimuy".includes(nx)) {
          token += nx;
          ++pos;
        }
        token= toke(line, tcol, token);
      }
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
        if ( ch=== "\n") ch= "\\n";
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
    else if (ch === "&" && nx === "&") {
      if (token.length===0) tcol= col;
      token += ch + nx;
      ++pos;
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
    else if (ch === "/" && token.length===0) {
      regexQ=true;
      tcol=col;
      token += ch;
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

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
module.exports= {
  lexer: tokenize,
  REGEX: REGEX,
  jsid: normalizeId,
  testid_Q: testid_Q
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF


