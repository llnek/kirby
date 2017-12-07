/*Auto generated by Kirby - v1.0.0 czlab.kirby.main - Wed Dec 06 2017 18:29:05 GMT-0800 (PST)*/

const gopt = require("node-getopt");
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
////////////////////////////////////////////////////////////////////////////////
//fn: [compileFiles] in file: main.ky,line: 27
const compileFiles = function(opt) {
  let fin = (opt.argv[0] ?
    opt.argv[0] :
    error_BANG("No Input file"));
  let fout = opt.argv[1];
  if ( (!fout) ) {
    fout = fin.replace(/\.ky$/, ".js");
    if ( (fout === fin) ) {
      error_BANG("Input file must have extension \".ky\"");
    }
  }
  return (function() {
    try {
      let options = opt.options;
      let source = null;
      let GS__9 = options;
      let source_DASH_map = GS__9["source-map"];
      let show_DASH_ast = GS__9["show-ast"];
      if (console) {
        console.log([
          [
            "kirby v",
            tx.version
          ].join(""),
          ": compiling: ",
          fin,
          " -> ",
          fout
        ].join(""));
      }
      source = fs.readFileSync(fin, "utf8");
      return (show_DASH_ast ?
        tx.dbgAST(source, fin) :
        (function() {
          let out = (source_DASH_map ?
            tx.transpileWithSrcMap(source, fin, options) :
            tx.transpile(source, fin, options));
          return fs.writeFileSync(fout, out, "utf8");
        }).call(this));
    } catch (e) {
      return error_BANG(e);
    }
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [init] in file: main.ky,line: 56
const init = function() {
  require.extensions[".ky"] = function(module, fname) {
    let code = require("./compiler").transpile(fs.readFileSync(fname, "utf8"), path.relative(process.cwd(), fname));
    return module._compile(code, fname);
  };
  return rt.init();
};
////////////////////////////////////////////////////////////////////////////////
//fn: [doWatch] in file: main.ky,line: 69
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
        let GS__10 = null;
        "finished walking the tree";
        return GS__10;
      }).call(this) :
      ((curr && (0 === curr.nlink)) ?
        (function() {
          let GS__11 = null;
          "f was removed";
          return GS__11;
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
////////////////////////////////////////////////////////////////////////////////
//fn: [pcli] in file: main.ky,line: 96
const pcli = function(opt) {
  let GS__12 = opt.options;
  let version = GS__12["version"];
  let repl = GS__12["repl"];
  let watch = GS__12["watch"];
  let help = GS__12["help"];
  if (version) {
    console.info(tx.version);
  } else {
    if (watch) {
      doWatch(process.cwd());
    } else {
      if (repl) {
        rt.runRepl();
      } else {
        if (help) {
          opt.showHelp();
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
////////////////////////////////////////////////////////////////////////////////
//fn: [main] in file: main.ky,line: 107
const main = function() {
  let opt = gopt.create([
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
  return (init() && pcli(opt.parseSystem()));
};
main()
module.exports = {
  main: main
};