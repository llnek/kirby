/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict"

  //////////////////////////////////////////////////////////////////////////////
  /**
   * @module
   */
  function _module(){
    const getopt = require("node-getopt");
    const cp = require("child_process");
    const watch = require("watch");
    const path = require("path");
    const fs = require("fs");
    const rdr= require("./reader");
    const std = require("./kernel");
    const rt = require("./engine");
    const cc = require("./compiler");
    const spfs = require("./spfs");
    const println=std["println"];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** error and exit */
    function errOut(msg){
      println(msg);
      return process.exit(1)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** compile code */
    function compile([fin,fout],options){
      if(!fin)
        errOut("Source file not provided.");
      fin=path.resolve(fin)
      if(!fin.endsWith(".ky"))
        errOut("Source file extension != '.ky'");
      if(!fout)
        fout=fin.replace(/\.ky$/g, ".js");
      try{
        let source = rt.slurp(fin);
        if(options["show-ast"]){
          try{
            println(rdr.dbgAST(source, fin))
          }catch(e){
            console.log(e);
            console.log(new Error().stack);
          }
        }else{
          println(`"kirby v${cc.version}: compiling: ${fin} -> ${fout}`);
          let [ret,err]= cc.transpile(source, fin, options);
          if(options["show-code"]) console.log(ret);
          rt.spit(fout, ret);
          if(err)
            throw err;
        }
      }catch(e){
        errOut(e)
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function init(){
      return rt.init(cc.version)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doWatch(cwd){
      println("Watching", cwd, " for file changes...");
      watch.watchTree(cwd,{
        "ignoreDirectoryPattern": /node_modules/,
        "ignoreDotFiles": true,
        "interval":30,
        "filter": (f,stat)=> !stat.isDirectory() && f.endsWith(".ky")
      }, function(f, curr, prev){
        if(std.isObject(f) && prev === null && curr === null){
          //finished walking the tree
          return null
        }
        if(curr && curr.nlink == 0){
          //f was removed
          return null
        }
        return cp.spawn("bin/kirby.js",
                        [f.toString().slice(cwd.length+1)],{ "stdio": "inherit" }) })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function pcli(gopt){
      let {argv,options}= gopt.parseSystem();
      argv=argv||[];
      options=options || {};
      let {version,repl,watch,help} = options;
      if(version){
        console.info(cc.version)
      }else if(watch){
        doWatch(process.cwd())
      }else if(repl){
        rt.runRepl()
      }else if(help || 0 == argv.length){
        gopt.showHelp()
      }else{
        compile(argv,options)
      }
      return true
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function main(){
      let cli=getopt.create([
        //["w", "watch", "auto-compile changed files"],
        ["f", "no-format", "no-format source code"],
        ["c", "show-code", "print code to stdout"],
        ["m", "source-map", "generate source map"],
        ["v", "version", "show version"],
        ["r", "repl", "start a repl"],
        ["h", "help", "show help"],
        ["t", "show-ast", "show AST"]]).
      setHelp(["kirby [OPTIONS] [<infile>] [<outfile>]\n\n",
               "<outfile> defaults to <infile>.js\n\n", "[[OPTIONS]]\n\n"].join("")).
      bindHelp();
      return init() && pcli(cli)
    }

    //main();

    const _$={
      da57bc0172fb42438a11e6e8778f36fb: {
        ns: "czlab.kirby.main",
        vars: ["main"],
        macros: {}
      },
      main: main
    };

    return _$;
  }

  //export--------------------------------------------------------------------
  if(typeof module == "object" && module.exports){
    module.exports=_module()
  }else{
    throw "Cannot run outside of NodeJS!"
  }

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

