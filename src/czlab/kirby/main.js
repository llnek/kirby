/*Auto generated by Kirby - v1.0.0 czlab.kirby.main Wed Dec 06 2017 18:28:54 GMT-0800 (PST)*/

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
      console.log([____args[0]].join(""));
    }
    return process.exit(1);
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//name: [compileFiles] in file: main.ky near line: 27
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
      let G____9 = options;
      let source_DASH_map = G____9["source-map"];
      let show_DASH_ast = G____9["show-ast"];
      if (console) {
        console.log([["kirby v", tx.version].join(""), ": compiling: ", fin, " -> ", fout].join(""));
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
//name: [init] in file: main.ky near line: 56
const init = function() {
  require.extensions[".ky"] = function(module, fname) {
    let code = require("./compiler").transpile(fs.readFileSync(fname, "utf8"), path.relative(process.cwd(), fname));
    return module._compile(code, fname);
  };
  return rt.init();
};
////////////////////////////////////////////////////////////////////////////////
//name: [doWatch] in file: main.ky near line: 69
const doWatch = function(cwd) {
  if (console) {
    console.log(["Watching", cwd, "for \".ky\" file changes..."].join(""));
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
        let G__1 = null;
        "finished walking the tree";
        return G__1;
      }).call(this) :
      ((curr && (0 === curr.nlink)) ?
        (function() {
          let G__2 = null;
          "f was removed";
          return G__2;
        }).call(this) :
        (true ?
          (function() {
            return cp.spawn("bin/boot.js", [f.slice((cwd.length + 1))], {
              "stdio": "inherit"
            });
          }).call(this) :
          null)));
  });
};
////////////////////////////////////////////////////////////////////////////////
//name: [pcli] in file: main.ky near line: 96
const pcli = function(opt) {
  let G____10 = opt.options;
  let version = G____10["version"];
  let repl = G____10["repl"];
  let watch = G____10["watch"];
  let help = G____10["help"];
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
//name: [main] in file: main.ky near line: 107
const main = function() {
  let opt = gopt.create([["w", "watch", "auto-compile changed files"], ["m", "source-map", "generate source maps"], ["f", "format", "format source code"], ["b", "bundle", "bundle for browser"], ["h", "help", "display this help"], ["v", "version", "show version"], ["r", "repl", "start a repl"], ["t", "show-ast", "show AST"]]).setHelp(["kirby [OPTIONS] [<infile>] [<outfile>]\n\n", "<outfile> default to <infile> with \".js\" suffix\n\n", "[[OPTIONS]]\n\n"].join("")).bindHelp();
  return (init() && pcli(opt.parseSystem()));
};
main()
module.exports = {
  main: main
};