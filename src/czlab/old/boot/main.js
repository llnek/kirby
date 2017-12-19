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
             ["f","format","format files"],
             ["w","watch","auto-compile changed files"],
             ["m","map","generate source maps"],
             ["t","tree","show AST"]]);
opt.setHelp("kirby [OPTIONS] [<infile>] [<outfile>]\n\n"+
            "<outfile> default to <infile> with \".js\" extension\n\n"+
            "Also compile stdin to stdout\n"+
            "eg. $ echo '(console.log \"hello\")' | kirby\n\n"+
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
    fout= fin.replace(new RegExp("\\.ky$"), ".js");
    if (fout === fin) {
      error("Input file must have extension \".ky\"");
    }
  }
  try {
    let wantMap_Q = opt.options["map"],
        dbgAST_Q= opt.options[ "tree"],
        source=null,
        dirs= opt.options["include-dir"];
    if (!dbgAST_Q) {
      console.log("kirby v1.0.0"+ ": compiling: "+ fin+ " -> "+ fout);
    }
    source= fs.readFileSync(fin, "utf8");
    if (dbgAST_Q) {
      kirby.dbgAST(source,fin);
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
  require.extensions[".ky"]=function(module, fname) {
    let kb= require("./cg/transpiler"),
        code= fs.readFileSync(fname, "utf8");
    module._compile(
      kb.transpile(code, path.relative(process.cwd(), fname)), fname);
  };
  return rt.init();
}


function watch() {
  let cwd=process.cwd();
  console.log("Watching" + cwd + "for \".ky\" file changes...");
  watcher.watchTree(
    cwd,
    {filter:
      function(f,stat) {
        return stat.isDirectory() ||
               f.indexOf(".ky") !== -1; },
     ignoreDotFiles: true,
     ignoreDirectoryPattern: /node_modules/ },
    function(f, curr, prev) {
      if (typeof f === "object" && prev === null && curr === null) {
        // Finished walking the tree
      } else if (curr && curr.nlink === 0) {
        // f was removed
      } //else if (prev === null) {/*new file*/}
      else {
        // f is a new file or changed
        require("child_process").spawn("bin/boot.js",
          [f.substring(1+ cwd.length)], {stdio: "inherit"});
      }
    });
}


function pcli() {
  let v = opt.options["version"],
      w = opt.options["watch"],
      h = opt.options["help"];
  if (v) {
    console.info(kirby.version);
  }
  else if (h) {
    opt.showHelp();
  }
  else if (w) {
    watch();
  }
  else {
    compileFiles();
  }
}
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function main() {
  return init() && pcli();
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
main();

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF


