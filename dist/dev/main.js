/*Auto generated by Kirby - v1.0.0 czlab.kirby.main - Sun Dec 10 2017 18:55:40 GMT-0800 (PST)*/

const getopt = require("node-getopt");
const cp = require("child_process");
const watch = require("watch");
const path = require("path");
const fs = require("fs");
const tx = require("./compiler");
const std = require("./stdlib");
const object_QUERY = std["object_QUERY"];
const rt = require("./engine");
const kirbystdlibref = std;
var error_BANG = function() {
  let ____args = Array.prototype.slice.call(arguments);
  return (function() {
    if (console) {
      console.log([
        ____args[0]
      ].join(""));
    }
    return process.exit(1);
  }).call(this);
};
//fn: [compileFiles] in file: main.ky,line: 27
const compileFiles = function(opt) {
  let GS__9 = opt.argv;
  let fin = GS__9[0];
  let fout = GS__9[1];
  if ( (!fin) ) {
    error_BANG("No Input file");
  }
  if ( (!fout) ) {
    fout = fin.replace(/\.ky$/, ".js");
    if ( (fout === fin) ) {
      error_BANG("Input file must have extension \".ky\"");
    }
  }
  return (function() {
    try {
      if (console) {
        console.log([
          [
            "kirby v",
            tx.version
          ].join(""),
          ": compiling file: ",
          fin,
          " -> ",
          fout
        ].join(""));
      }
      let options = opt.options;
      let GS__10 = options;
      let source_DASH_map = GS__10["source-map"];
      let format = GS__10["format"];
      let show_DASH_ast = GS__10["show-ast"];
      let source = fs.readFileSync(fin, "utf8");
      return (show_DASH_ast ?
        tx.dbgAST(source, fin) :
        fs.writeFileSync(fout, tx.transpile(source, fin, options), "utf-8"));
    } catch (e) {
      return error_BANG(e);
    }
  }).call(this);
};
//fn: [init] in file: main.ky,line: 50
const init = function() {
  require.extensions[".ky"] = function(module, fname) {
    let code = require("./compiler").transpile(fs.readFileSync(fname, "utf8"), path.relative(process.cwd(), fname));
    return module._compile(code, fname);
  };
  return rt.init(tx.version);
};
//fn: [doWatch] in file: main.ky,line: 63
const doWatch = function(cwd) {
  if (console) {
    console.log([
      "Watching",
      cwd,
      "for \".ky\" file changes..."
    ].join(""));
  }
  return watch.watchTree(cwd, {
    "ignoreDirectoryPattern": /node_modules/,
    "ignoreDotFiles": true,
    "filter": function(f, stat) {
      return (f.endsWith(".ky") || stat.isDirectory());
    }
  }, function(f, curr, prev) {
    return ((object_QUERY(f) && (prev === null) && (curr === null)) ?
      (function() {
        let GS__11 = null;
        "finished walking the tree";
        return GS__11;
      }).call(this) :
      ((curr && (0 === curr.nlink)) ?
        (function() {
          let GS__12 = null;
          "f was removed";
          return GS__12;
        }).call(this) :
        (true ?
          (function() {
            return cp.spawn("bin/boot.js", [
              f.slice((cwd.length + 1))
            ], {
              "stdio": "inherit"
            });
          }).call(this) :
          null)));
  });
};
//fn: [pcli] in file: main.ky,line: 90
const pcli = function(gopt) {
  let opt = gopt.parseSystem();
  let GS__13 = opt.options;
  let version = GS__13["version"];
  let repl = GS__13["repl"];
  let watch = GS__13["watch"];
  let help = GS__13["help"];
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
            compileFiles(opt);
          }
        }
      }
    }
  }
  return true;
};
//fn: [main] in file: main.ky,line: 104
const main = function() {
  let gopt = getopt.create([
    [
      "w",
      "watch",
      "auto-compile changed files"
    ],
    [
      "m",
      "source-map",
      "generate source maps"
    ],
    [
      "f",
      "format",
      "format source code"
    ],
    [
      "b",
      "bundle",
      "bundle for browser"
    ],
    [
      "h",
      "help",
      "display this help"
    ],
    [
      "v",
      "version",
      "show version"
    ],
    [
      "r",
      "repl",
      "start a repl"
    ],
    [
      "t",
      "show-ast",
      "show AST"
    ]
  ]).setHelp([
    "kirby [OPTIONS] [<infile>] [<outfile>]\n\n",
    "<outfile> default to <infile> with \".js\" suffix\n\n",
    "[[OPTIONS]]\n\n"
  ].join("")).bindHelp();
  return (init() && pcli(gopt));
};
main()
module.exports = {
  main: main
};