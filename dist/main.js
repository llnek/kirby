/*Auto generated by Kirby - v1.0.0 */

var _STARpath_STAR= require("path");
var _STARfs_STAR= require("fs");
var _STARprocess_STAR = process;
require.extensions[".kirby"] = function (module,fname) {
  let kb = require("kirby"),
    code = _STARfs_STAR.readFileSync(fname,"utf8");
  return module._compile(kb.transpile(code,_STARpath_STAR.relative(_STARprocess_STAR.cwd(),fname)),fname);
};
function some_QUERY(obj) {
  return (!((typeof(obj) === "undefined") || (Object.prototype.toString.call(obj) === "[object Null]")));
}

function zero_QUERY(obj) {
  return ((typeof(obj) === "number") ?
    (0 == obj) :
    false);
}

function get_QUERY_QUERY(obj,fld,dft) {
  let x = (obj ?
    obj[fld] :
    undefined);
  return ((typeof(x) === "undefined") ?
    dft :
    x);
}

function contains_QUERY(coll,itm) {
  return (((Object.prototype.toString.call(coll) === "[object Array]") || (typeof(coll) === "string")) ?
    coll.includes(itm) :
    ((Object.prototype.toString.call(coll) === "[object Object]") ?
      Object.keys(coll).includes(itm) :
      (true ?
        false :
        undefined)));
}

function excludes_QUERY(coll,itm) {
  return (!contains_QUERY(coll,itm));
}

function make_array(len,obj) {
  return   (function() {
  let ret = [];
  return   (function() {
  (function () {
for (var i = 0; (i < len); i = (i + 1)) {
        (function() {
    return ret.push(obj);
    }).call(this);
  }
}).call(this);
  return ret;
  }).call(this);
  }).call(this);
}

function each_key(func,obj) {
  return Object.keys(obj).forEach(function (k) {
    return func(obj[k],k,obj);
  });
}

function zipmap(keys,vals) {
  let vs = (vals || []);
  return   (function() {
  let ret = {};
  return   (function() {
  (function () {
for (var i = 0; (i < (keys)["length"]); i = (i + 1)) {
        (function() {
    vv = nth(vs,i);
    return ret[nth(keys,i)] = ((typeof(vv) === "undefined") ?
      null :
      vv);
    }).call(this);
  }
}).call(this);
  return ret;
  }).call(this);
  }).call(this);
}

function last(coll) {
  return (coll ?
    coll[((coll)["length"] - 1)] :
    undefined);
}

function nth(coll,pos) {
  return (coll ?
    coll[pos] :
    undefined);
}

function even_QUERY(n) {
  return ((n % 2) === 0);
}

function odd_QUERY(n) {
  return (!even_QUERY(n));
}

function pos_QUERY(arg) {
  return ((typeof(arg) === "number") && (arg > 0));
}

function neg_QUERY(arg) {
  return ((typeof(arg) === "number") && (arg < 0));
}

function constantly(x) {
  return function () {
    return x;
  };
}

function identity(x) {
  return x;
}

function conj_BANG(c,a) {
  c.push(a);
  return c;
}

function conj_BANG_BANG(c,a) {
  (a ?
    c.push(a) :
    undefined);
  return c;
}

function not_empty(x) {
  return ((x && ((x)["length"] > 0)) ?
    x :
    null);
}

function empty_QUERY(x) {
  return (x ?
    (0 == (x)["length"]) :
    true);
}

function seq(x) {
  return ((typeof(x) === "string") ?
    Array.from(x) :
    ((Object.prototype.toString.call(x) === "[object Array]") ?
      x :
      ((Object.prototype.toString.call(x) === "[object Object]") ?
        Object.entries(x) :
        (true ?
          [] :
          undefined))));
}

var _STARreadline_STAR= require("readline");
var _STARkirby_STAR= require("kirby");
var _STARprocess_STAR = process,
  prefix = "kirby> ";
function runrepl() {
  let cli = _STARreadline_STAR.createInterface((_STARprocess_STAR)["stdin"],(_STARprocess_STAR)["stdout"]);
  cli.on("line",function (line) {
    (function() {
    try {
      let l = _STARkirby_STAR.transpile(line);
      return console.log(this.eval(l));

    } catch (err) {
return     (function() {
    return console.log(err);
    }).call(this);
    }
    }).call(this);
    cli.setPrompt(prefix,(prefix)["length"]);
    return cli.prompt();
  });
  cli.on("close",function () {
    console.log("Bye!");
    return _STARprocess_STAR.exit(0);
  });
  console.log([prefix,"Kirby REPL v1.0.0"].join(""));
  cli.setPrompt(prefix,(prefix)["length"]);
  return cli.prompt();
}

var _STARgopt_STAR= require("node-getopt");
var _STARwatcher_STAR= require("watch");
var _STARpath_STAR= require("path");
var _STARfs= require("fs");
var _STARprocess_STAR = process,
  error = function (e) {
    console.error([e].join(""));
    return _STARprocess_STAR.exit(1);
  },
  validFlag_QUERY = new RegExp("-h\\b|-r\\b|-v\\b|-b\\b|-s\\b|-t\\b");
var opt = _STARgopt_STAR.create([
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
    "run",
    "run .kirby files"
  ],
  [
    "w",
    "watch",
    "auto-compile changed files"
  ],
  [
    "b",
    "browser-bundle",
    "bundle for browser"
  ],
  [
    "m",
    "map",
    "generate source maps"
  ],
  [
    "t",
    "tree",
    "show AST"
  ],
  [
    "i",
    "include-dir=ARG+",
    "add directory to include search path"
  ]
]).setHelp(["kirby [OPTION] [<infile>] [<outfile>]\n\n","<outfile> default to <infile> with \".js\" extension\n\n","Also compile stdin to stdout\n","eg. $ echo '(console.log \"hello\")' | kirby\n\n","[[OPTIONS]]\n\n"].join("")).bindHelp().parseSystem();
function handleNoArgs() {
  let pout = (_STARprocess_STAR)["stdout"],
    source = "",
    pin = (_STARprocess_STAR)["stdin"];
  pin.resume();
  pin.setEncoding("utf8");
  pin.on("data",function (chunk) {
    return source += chunk.toString();
  });
  pin.on("end",function () {
    return (function() {
    try {
      return pout.write(_STARkirby_STAR.transpile(source,_STARprocess_STAR.cwd()));

    } catch (e) {
return     (function() {
    return error(e);
    }).call(this);
    }
    }).call(this);
  });
  pout.on("error",error);
  pin.on("error",error);
  return setTimeout(function () {
    return (zero_QUERY((pin)["bytesRead"]) ?
            (function() {
      pin.removeAllListeners("data");
      return runrepl();
      }).call(this) :
      undefined);
  },20);
}

function compileFiles() {
  let fin = (nth(opt.argv,0) ?
      nth(opt.argv,0) :
      error("No Input file")),
    fout = nth(opt.argv,1);
  ((!fout) ?
        (function() {
    fout = fin.replace(new RegExp("\\.kirby$"),".js");
    return ((fout === fin) ?
      error("Input file must have extension \".kirby\"") :
      undefined);
    }).call(this) :
    undefined);
  return (function() {
  try {
    let wantMap_QUERY = opt.options["map"],
      dbgAST_QUERY = opt.options["tree"],
      source = null,
      dirs = opt.options["include-dir"];
    ((!dbgAST_QUERY) ?
      console.log(["kirby v1.0.0",": compiling: ",fin," -> ",fout].join("")) :
      undefined);
    source = _STARfs_STAR.readFileSync(fin,"utf8");
    return (dbgAST_QUERY ?
      _STARkirby_STAR.dbgAST(source,fin,dirs) :
      _STARfs_STAR.writeFileSync(fout,(wantMap_QUERY ?
        _STARkirby_STAR.transpileWithSrcMap(source,fin,dirs) :
        _STARkirby_STAR.transpile(source,fin,dirs)),"utf8"));

  } catch (e) {
return   (function() {
  return error(e);
  }).call(this);
  }
  }).call(this);
}

function _main() {
  return ((empty_QUERY(opt.argv) && empty_QUERY(Object.keys(opt.options))) ?
    handleNoArgs() :
    (opt.options["version"] ?
      console.log(["Version: ",MODULE_VERSION].join("")) :
      (opt.options["browser-bundle"] ?
                (function() {
        let bundle = require.resolve("kirby/lib/browser-bundle.js");
        return _STARfs_STAR.createReadStream(bundle).pipe()(_STARfs_STAR.createWriteStream("browser-bundle.js"));
        }).call(this) :
        (opt.options["run"] ?
                    (function() {
          let a1 = nth(opt.argv,0),
            infile = a1;
          ((!a1) ?
            error("No input file") :
            undefined);
          ((!(a1.endsWith(".kirby") || a1.endsWith(".js"))) ?
            error("Input file must end with \".kirby\" or \".js\"") :
            undefined);
          return require(infile);
          }).call(this) :
          (opt.options["watch"] ?
                        (function() {
            let cwd = (_STARprocess_STAR)["cwd"];
            console.log("Watching",cwd,"for file changes...");
            return _STARwatcher_STAR.watchTree(cwd,{
              filter: function (f,stat) {
                return ((stat)["isDirectory"] || (f.indexOf(".kirby") !== -1));
              },
              ignoreDotFiles: true,
              ignoreDirectoryPattern: new RegExp("node_modules")
            },function (f,curr,prev) {
              return ((curr && (curr.nlink !== 0)) ?
                require("child_process").spawn("kirby",[
                  f.substring(((cwd)["length"] + 1))
                ],{
                  stdio: "inherit"
                }) :
                (((Object.prototype.toString.call(f) === "[object Object]") && (Object.prototype.toString.call(prev) === "[object Null]") && (Object.prototype.toString.call(curr) === "[object Null]")) ?
                  each_key(function (stat,initialf) {
                    return ((!(initialf === cwd)) ?
                                            (function() {
                      return require("child_process").spawn("kirby",[
                        initialf.substring(((cwd)["length"] + 1))
                      ],{
                        stdio: "inherit"
                      });
                      }).call(this) :
                      undefined);
                  },f) :
                  undefined));
            });
            }).call(this) :
            (true ?
              compileFiles() :
              undefined))))));
}

_main();


module.exports = {
  _main: _main
};

