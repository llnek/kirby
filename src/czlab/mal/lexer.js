var tn=require("./tnode"),
    types=require("./types"),
    tnode=tn.tnode,
    tnodeEx=tn.tnodeEx;

//
function regex(s,glim) {return new RegExp(s,glim);}
var REGEX= {
  noret: regex("^def\\b|^var\\b|^set!\\b|^throw\\b"),
  id: regex("^[a-zA-Z_$][?\\-*!0-9a-zA-Z_'<>#@$]*$"),
  id2: regex("^[*\\-][?\\-*!0-9a-zA-Z_'<>#@$]+$"),
  float: regex("^[-+]?[0-9]+\\.[0-9]+$"),
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

function normalizeId (name) {
  let pfx= "";
  if (types._string_Q(name) &&
      "-" === name.charAt(0)) {
    pfx= "-";
    name= name.slice(1);
  }

  if (testid_Q(name)) {
    return (pfx+name).replace(REGEX.query, "_QUERY").
        replace(REGEX.bang, "_BANG").
        replace(REGEX.dash, "_").
        replace(REGEX.quote, "_QTE").
        replace(REGEX.hash, "_HASH").
        replace(REGEX.at, "_AT").
        replace(REGEX.less, "_LT").
        replace(REGEX.greater, "_GT").
        replace(REGEX.star, "_STAR");
  } else {
    return (pfx === "") ? name : pfx+ name;
  }
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

module.exports= {
  lexer: tokenize,
  REGEX: REGEX,
  jsid: normalizeId,
  testid_Q: testid_Q
};



