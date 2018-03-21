/*Auto generated by Kirby v1.0.0 - Tue Mar 20 2018 23:45:24 GMT-0700 (PDT)
  czlab.kirby.main
{"doc" "" "author" "Kenneth Leung"}
*/

const getopt = require("node-getopt");
const cp = require("child_process");
const watch = require("watch");
const path = require("path");
const fs = require("fs");
const tx = require("./compiler");
const rt = require("./engine");
const std = require("./stdlib");
const object_QMRK = std["object_QMRK"];
const println = std["println"];
const kirbystdlibref = std;
const __module_namespace__ = "czlab.kirby.main";
////////////////////////////////////////////////////////////////////////////////
//fn: [error!] in file: main.ky, line: 26
const error_BANG = function(msg) {
  println(msg);
  return process.exit(1);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [compileSource] in file: main.ky, line: 29
const compileSource = function(opt) {
  let GS__9 = opt.argv;
  let fin = kirbystdlibref.getIndex(GS__9, 0);
  let fout = kirbystdlibref.getIndex(GS__9, 1);
  let options = opt.options;
  if ( (!fin) ) {
    error_BANG("No source file");
  } else {
    (
    fin = path.resolve(fin));
  }
  if ( (!fin.endsWith(".ky")) ) {
    error_BANG("Source file extension != '.ky'");
  } else {
    null;
  }
  if ( (!fout) ) {
    (
    fout = fin.replace(/\.ky$/g, ".js"));
  } else {
    null;
  }
  return (function() {
    try {
      let GS__10 = options;
      let source_DASH_map = kirbystdlibref.getProp(GS__10, "source-map");
      let no_DASH_format = kirbystdlibref.getProp(GS__10, "no-format");
      let show_DASH_ast = kirbystdlibref.getProp(GS__10, "show-ast");
      if ( (!show_DASH_ast) ) {
        println(["kirby v", tx.version].join(""), ": compiling: ", fin, " -> ", fout);
      } else {
        null;
      }
      let source = rt.slurp(fin);
      if (show_DASH_ast) {
        println(tx.dbgAST(source, fin));
      } else {
        let GS__11 = tx.transpile(source, fin, options);
        let ret = kirbystdlibref.getIndex(GS__11, 0);
        let err = kirbystdlibref.getIndex(GS__11, 1);
        rt.spit(fout, ret);
        if (err) {
          throw err;
        }
      }
      return null;
    } catch (e) {
      return error_BANG(e);
    }
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [init] in file: main.ky, line: 57
const init = function() {
  return rt.init(tx.version);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doWatch] in file: main.ky, line: 61
const doWatch = function(cwd) {
  std.println("Watching", cwd, "for file changes...");
  watch.watchTree(cwd, {
    "ignoreDirectoryPattern": /node_modules/,
    "ignoreDotFiles": true,
    "filter": function(f, stat) {
      return (f.endsWith(".ky") || stat.isDirectory());
    }
  }, function(f, curr, prev) {
    return ((object_QMRK(f) && ((prev === null) && (curr === null))) ?
      (function() {
        "finished walking the tree";
        return null;
      }).call(this) :
      ((curr && ((curr.nlink === 0))) ?
        (function() {
          "f was removed";
          return null;
        }).call(this) :
        (true ?
          (function() {
            return cp.spawn("bin/kirby.js", [f.slice((cwd.length + 1))], {
              "stdio": "inherit"
            });
          }).call(this) :
          null)));
  });
  return null;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [pcli] in file: main.ky, line: 86
const pcli = function(gopt) {
  let opt = gopt.parseSystem();
  let GS__12 = opt.options;
  let version = kirbystdlibref.getProp(GS__12, "version");
  let repl = kirbystdlibref.getProp(GS__12, "repl");
  let watch = kirbystdlibref.getProp(GS__12, "watch");
  let help = kirbystdlibref.getProp(GS__12, "help");
  if (version) {
    console.info(tx.version);
  } else {
    if (watch) {
      doWatch(process.cwd());
    } else {
      if (repl) {
        rt.runRepl();
      } else {
        if ( (help || (0 === kirbystdlibref.count(opt.argv))) ) {
          gopt.showHelp();
        } else {
          if (true) {
            compileSource(opt);
          }
        }
      }
    }
  }
  return true;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [main] in file: main.ky, line: 100
const main = function() {
  let gopt = getopt.create([["v", "verbose", "show details of the source"], ["w", "watch", "auto-compile changed files"], ["m", "source-map", "generate source maps"], ["f", "no-format", "no-format source code"], ["V", "version", "show version"], ["r", "repl", "start a repl"], ["h", "help", "show help"], ["t", "show-ast", "show AST"]]).setHelp(["kirby [OPTIONS] [<infile>] [<outfile>]\n\n", "<outfile> defaults to <infile>.js\n\n", "[[OPTIONS]]\n\n"].join("")).bindHelp();
  return (init() && pcli(gopt));
};
main();
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.kirby.main",
    macros: {}
  },
  main: main
};