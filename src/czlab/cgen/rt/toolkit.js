/*Auto generated by Kirby - v1.0.0 czlab.kalaso.toolkit Sun Oct 15 2017 17:14:54 GMT-0700 (PDT)*/

var types= require("../bl/types");
var std= require("../bl/stdlib");
;
//
function pr_str_A(arr) {
return arr.map(function (e) {
return types.pr_obj(e);
});
}

//
function pr_str() {
let xs=Array.prototype.slice.call(arguments,0);
return pr_str_A(xs).join(" ");
}

//
function str_A(arr) {
return arr.map(function (e) {
return types.pr_obj(e,false);
});
}

//
function str() {
let xs=Array.prototype.slice.call(arguments,0);
return str_A(xs).join("");
}

//
function prn() {
let xs=Array.prototype.slice.call(arguments,0);
return std.println.apply(this,pr_str_A(xs));
}

//
function println() {
let xs=Array.prototype.slice.call(arguments,0);
return std.println.apply(this,str_A(xs));
}

//
function slurp(f) {
return require("fs").readFileSync(f,"utf-8");
}

//
function timeMillis() {
return new Date().getTime();
}

//
function assoc(src) {
let xs=Array.prototype.slice.call(arguments,1);
return types.assoc.apply(this,std.concat([
  types.clone(src)
],xs));
}

//
function dissoc(src) {
let xs=Array.prototype.slice.call(arguments,1);
return types.dissoc.apply(this,std.concat([
  types.clone(src)
],xs));
}

//
function cons(a,b) {
return std.concat([
  a
],b);
}

//
function conj(arr) {
let xs=Array.prototype.slice.call(arguments,1);
return (types.list_QUERY(arr) ?
  xs.reverse().concat(arr) :
  (std.some_QUERY(arr) ?
    (function (v) {
    v["__isvector__"] = true;
    return v;
    })(std.concat(arr,xs)) :
    (true ?
      arr :
      null)));
}

//
function seq(obj) {
return (types.list_QUERY(obj) ?
  (std.not_empty(obj) ?
    obj :
    null) :
  (types.vector_QUERY(obj) ?
    (std.not_empty(obj) ?
      std.slice(obj) :
      null) :
    ((typeof(obj) === "string") ?
      (std.not_empty(obj) ?
        obj.split("") :
        null) :
      ((obj === null) ?
        null :
        (true ?
          std.raise_BANG("seq: called on non-sequence") :
          null)))));
}

//
function apply(f) {
let xs=Array.prototype.slice.call(arguments,1);
let end = last_index(xs);
return f.apply(this,std.concat(std.slice(xs,0,end),xs[end]));
}

var GLOBAL = ((typeof(window) === "undefined") ?
  undefined :
  window);
//
function resolveJS(s) {
return [
  (std.contains_QUERY(s,".") ?
    (function (re,mc) {
    return eval(mc[1]);
    })(new RegExp("^(.*)\\.[^\\.]*$","g"),re.exec(s)) :
    GLOBAL),
  eval(s)
];
}

//
function filterJS(obj) {
let cache = [],
  s = (obj ?
    JSON.stringify(obj,function (k,v) {
    ((Object.prototype.toString.call(v) === "[object Object]") ?
      (std.contains_QUERY(cache,v) ?
        v = undefined :
        cache.push(v)) :
      null);
    return v;
    }) :
    null);
return (std.not_empty(s) ?
  JSON.parse(s) :
  null);
}

//
function withMeta(obj,m) {
return (function (ret) {
ret["__meta__"] = m;
return ret;
})(types.clone(obj));
}

//
function meta(obj) {
(((!types.sequential_QUERY(obj))&&(!types.hashmap_QUERY(obj))&&(!types.object_QUERY(obj))&&(!(typeof(obj) === "function"))) ?
  std.raise_BANG("attempt to get metadata from: ",types.obj_type(obj)) :
  null);
return obj["__meta__"];
}

//
function deref(a) {
return a.value;
}

//
function reset_BANG(a,v) {
return a["value"] = v;
}

//
function swap_BANG(a,f) {
let xs=Array.prototype.slice.call(arguments,2);
let args = std.concat([
  a.value
],xs);
a["value"] = f.apply(this,args);
return a["value"];
}

//
function evalJS(s) {
return filterJS(eval(s.toString()));
}

//
function invokeJS(method) {
let xs=Array.prototype.slice.call(arguments,1);
let r = resolveJS(method),
  obj = first(r),
  f = second(r),
  res = f.apply(obj,xs);
return filterJS(res);
}

var gensym_counter = types.atom(0);
//
function gensym() {
return types.symbol(["G__",swap_BANG(gensym_counter,function (x) {
return (x+1);
})].join(""));
}

module.exports = {
  "is-same?": function (a,b) {
  return (a == b);
  },
  "obj-type*": types.obj_type,
  "gensym*": gensym,
  "is-eq?": types.eq_QUERY,
  "is-nil?": function (x) {
  return (x === null);
  },
  "is-some?": function (x) {
  return ((!(typeof(x) === "undefined"))&&(x !== null));
  },
  "slice*": function () {
let xs=Array.prototype.slice.call(arguments,0);
  return std.slice.apply(this,xs);
  },
  "throw*": function () {
let xs=Array.prototype.slice.call(arguments,0);
  return std.raise_BANG.apply(this,xs);
  },
  "#f?": function (x) {
  return (false === x);
  },
  "#t?": function (x) {
  return (true === x);
  },
  "is-str?": function (x) {
  return (typeof(x) === "string");
  },
  "symbol*": types.symbol,
  "is-symbol?": types.symbol_QUERY,
  "keyword*": types.keyword,
  "is-keyword?": types.keyword_QUERY,
  "pr-str*": pr_str,
  "str*": str,
  "prn*": prn,
  "println*": println,
  "slurp*": slurp,
  "<": function (a,b) {
  return (a < b);
  },
  "<=": function (a,b) {
  return (a <= b);
  },
  ">": function (a,b) {
  return (a > b);
  },
  ">=": function (a,b) {
  return (a >= b);
  },
  "+": function (a,b) {
  return (a+b);
  },
  "-": function (a,b) {
  return (a-b);
  },
  "*": function (a,b) {
  return (a*b);
  },
  "/": function (a,b) {
  return (a/b);
  },
  "time*": timeMillis,
  "list*": types.list,
  "is-list?": types.list_QUERY,
  "vector*": types.vector,
  "is-vector?": types.vector_QUERY,
  "hash-map*": types.hashmap,
  "is-map?": types.hashmap_QUERY,
  "assoc*": assoc,
  "dissoc*": dissoc,
  "is-contains?": function (c,x) {
  return (((Object.prototype.toString.call(c) === "[object Array]")||(typeof(c) === "string")) ?
    c.includes(x) :
    ((Object.prototype.toString.call(c) === "[object Object]") ?
      c.hasOwnProperty(x) :
      (true ?
        false :
        null)));
  },
  "get*": function (m,k) {
  return m[k];
  },
  "keys*": function (x) {
  return Object.keys(x);
  },
  "values*": function (x) {
  return Object.values(x);
  },
  "dec*": function (x) {
  return (x-1);
  },
  "inc*": function (x) {
  return (x+1);
  },
  "not*": function (x) {
  return (x ?
    false :
    true);
  },
  "is-even?": function (n) {
  return (0 === (n%2));
  },
  "is-odd?": function (n) {
  return (1 === (n%2));
  },
  "is-sequential?": types.sequential_QUERY,
  "cons*": cons,
  "concat*": function (arr) {
  arr = (arr||[]);
  return arr.concat.apply(arr,std.slice(arguments,1));
  },
  "nth*": function (arr,i) {
  return arr[i];
  },
  "first*": function (arr) {
  return arr[0];
  },
  "rest*": function (arr) {
  return (arr ?
    arr.slice(1) :
    []);
  },
  "is-empty?": function (arr) {
  return ((arr === null)||(0 === arr.length));
  },
  "count*": function (s) {
  return (((Object.prototype.toString.call(s) === "[object Array]")||(typeof(s) === "string")) ?
    s.length :
    ((s === null) ?
      0 :
      ((Object.prototype.toString.call(s) === "[object Object]") ?
        Object.keys(s) :
        (true ?
          0 :
          null))));
  },
  "apply*": apply,
  "map*": map,
  "type*": function (x) {
  return typeof(x);
  },
  "evens*": function (arr) {
  return (function (ret) {
  arr = (arr||[]);
  (function () {
for (var i = 0; (i < arr.length); i = (i+2)) {
        ret.push(arr[i]);
;
  }
}).call(this);
  return ret;
  })([]);
  },
  "odds*": function (arr) {
  return (function (ret) {
  arr = (arr||[]);
  (function () {
for (var i = 1; (i < arr.length); i = (i+2)) {
        ret.push(arr[i]);
;
  }
}).call(this);
  return ret;
  })([]);
  },
  "conj*": conj,
  "seq*": seq,
  "with-meta*": withMeta,
  "meta*": meta,
  "atom*": types.atom,
  "is-atom?": types.atom_QUERY,
  "deref*": deref,
  "reset*": reset,
  "swap*": swap,
  "js-eval*": evalJS,
  "js*": invokeJS
};
