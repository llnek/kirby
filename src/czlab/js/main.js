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
"use strict"
//////////////////////////////////////////////////////////////////////////////
const getopt = require("node-getopt");
const cp = require("child_process");
const watch = require("watch");
const path = require("path");
const fs = require("fs");
const tx = require("./compiler");
const rt = require("./engine");
const std = require("./stdlib");
const println = std["println"];
//////////////////////////////////////////////////////////////////////////////
/** error and exit */
function errorExit(msg){
  println(msg);
  return process.exit(1);
}
////////////////////////////////////////////////////////////////////////////////
/** compile code */
function compileSource(argv,options){
  let [fin,fout] = argv || [];
  if(!fin){
    errorExit("No source file")
  }else{
    fin=path.resolve(fin)
  }
  if(!fin.endsWith(".ky")){
    errorExit("Source file extension != '.ky'")
  }
  if(!fout){
    fout=fin.replace(/\.ky$/g, ".js")
  }
  options=options || {}
  try{
    let showAst = options["show-ast"];
    let source = rt.slurp(fin);
    if(showAst){
      println(tx.dbgAST(source, fin))
    }else{
      println(["kirby v", tx.version].join(""), ": compiling: ", fin, " -> ", fout);
      let [ret,err]= tx.transpile(source, fin, options);
      console.log(ret);
      rt.spit(fout, ret);
      if(err)
        throw err;
    }
  }catch(e){
    errorExit(e)
  }
}
//////////////////////////////////////////////////////////////////////////////
function init(){
  return rt.init(tx.version)
}
//////////////////////////////////////////////////////////////////////////////
function doWatch(cwd){
  println("Watching", cwd, "for file changes...");
  watch.watchTree(cwd,{
    "ignoreDirectoryPattern": /node_modules/,
    "ignoreDotFiles": true,
    "filter": function(f, stat){
      return f.endsWith(".ky") || stat.isDirectory()
    }
  }, function(f, curr, prev){
    if(is_object(f) && prev === null && curr === null){
      //finished walking the tree
      return null
    }else if(curr && curr.nlink === 0){
      //f was removed
      return null
    }else{
      return cp.spawn("bin/kirby.js", [f.slice(cwd.length+1)], {
        "stdio": "inherit"
      })
    }
  });
}
//////////////////////////////////////////////////////////////////////////////
function pcli(gopt){
  //let opt = gopt.parseSystem();
  let {argv,options}= gopt.parseSystem();
  let {version,repl,watch,help} = options;
  if(version){
    console.info(tx.version)
  }else if(watch){
    doWatch(process.cwd())
  }else if(repl){
    rt.runRepl()
  }else if(help || 0 === argv.length){
    gopt.showHelp()
  } else {
    compileSource(argv,options)
  }
  return true
}
//////////////////////////////////////////////////////////////////////////////
function main(){
  let cli=getopt.create([["v", "verbose", "show details of the source"],
    ["w", "watch", "auto-compile changed files"],
    ["m", "source-map", "generate source maps"],
    ["f", "no-format", "no-format source code"],
    ["V", "version", "show version"],
    ["r", "repl", "start a repl"],
    ["h", "help", "show help"],
    ["t", "show-ast", "show AST"]]).
  setHelp(["kirby [OPTIONS] [<infile>] [<outfile>]\n\n",
           "<outfile> defaults to <infile>.js\n\n", "[[OPTIONS]]\n\n"].join("")).
  bindHelp();
  //return init() && compileSource(["/tmp/stdlib.ky"]);//pcli(cli)
  return init() && pcli(cli)
  //return init() && rt.runRepl();
}
main();
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.main",
    vars: ["main"],
    macros: {}
  },
  main: main
};
//////////////////////////////////////////////////////////////////////////////
//EOF

