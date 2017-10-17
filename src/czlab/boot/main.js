// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var kirby=require("./cg/transpiler"),
    macros=require("./bl/macros"),
    rt=require("./rt/runtime"),
    gopt=require("node-getopt"),
    watcher=require("watch"),
    path=require("path"),
    fs=require("fs");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var validFlag_Q=new RegExp("-h\\b|-r\\b|-v\\b|-b\\b|-s\\b|-t\\b");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var error=function(e) {
  console.error(e);
  process.exit(1);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var opt=
gopt.create([["h","help","display this help"],
             ["v","version","show version"],
             ["r","run","run .ky files"],
             ["w","watch","auto-compile changed files"],
             ["b","browser-bundle","bundle for browser"],
             ["m","map","generate source maps"],
             ["t","tree","show AST"],
             ["i","include-dir=ARG+","add directory to include search path"]]);
opt.setHelp("kalaso [OPTION] [<infile>] [<outfile>]\n\n"+
            "<outfile> default to <infile> with \".js\" extension\n\n"+
            "Also compile stdin to stdout\n"+
            "eg. $ echo '(console.log \"hello\")' | kalaso\n\n"+
            "[[OPTIONS]]\n\n");
opt=opt.bindHelp().parseSystem();

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//when no args do stdin -> stdout compile or run repl and return null to
//halt operations.
function handleNoArgs() {
  let pout=process.stdout,
       source= "",
       pin=process.stdin;
  pin.resume();
  pin.setEncoding("utf8");
  pin.on("data",function(chunk) {
    source += chunk.toString();
  });
  pin.on("end",function() {
    try {
      pout.write(kirby.transpile(source, process.cwd()));
    } catch (e) {
      error(e);
    }
  });
  pout.on("error", error);
  pin.on("error", error);
  setTimeout(function() {
    if (0 === pin.bytesRead) {
      pin.removeAllListeners("data");
      runrepl();
    }
  }, 20);
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function compileFiles() {
  let fin,fout;
  if (opt.argv[0]) {
    fin= opt.argv[0];
  }
  else {
    error("No Input file");
  }
  fout= opt.argv[1];
  if (!fout) {
    fout= fin.replace(new RegExp("\\.kal$"), ".js");
    if (fout === fin) {
      error("Input file must have extension \".kal\"");
    }
  }
  try {
    let wantMap_Q = opt.options["map"],
        dbgAST_Q= opt.options[ "tree"],
        source=null,
        dirs= opt.options["include-dir"];
    if (!dbgAST_Q) {
      console.log("kalaso v1.0.0"+ ": compiling: "+ fin+ " -> "+ fout);
    }
    source= fs.readFileSync(fin, "utf8");
    if (dbgAST_Q) {
      kirby.dbgAST(source, fin, dirs);
    } else {
      let out;
      if (wantMap_Q)
        out= kirby.transpileWithSrcMap(source, fin, dirs);
      else
        out=kirby.transpile(source, fin, dirs);
      fs.writeFileSync( fout, out, "utf8");
    }
  } catch (e) {
    error(e);
  }
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function init() {
  require.extensions[".kal"]=function(module, fname) {
    let kb= require("./cg/transpiler"),
        code= fs.readFileSync(fname, "utf8");
    module._compile(
      kb.transpile(code, path.relative(process.cwd(), fname)), fname);
  };
  rt.init();
  macros.load();
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function main() {
  init();
  compileFiles();
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
main();

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF


