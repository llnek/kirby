var core = {};
var types = require('./types'),
    readline = require('./node_readline'),
    reader = require('./reader'),
    printer = require('./printer'),
    interop = require('./interop'),
    functor = Array.prototype.map,
    slicer = types.slice;

function mal_throw(exc) { throw exc; }

function pr_str() {
  return functor.call(arguments,
    function(exp) {
      return printer._pr_str(exp, true);
    }).join(" ");
}

function str() {
  return functor.call(arguments,
    function(exp) {
      return printer._pr_str(exp, false);
    }).join("");
}

function prn() {
  printer.println.apply({},
    functor.call(arguments,
    function(exp) {
      return printer._pr_str(exp, true);
    }));
}

function println() {
  printer.println.apply({},
    functor.call(arguments,
    function(exp) {
      return printer._pr_str(exp, false);
    }));
}

function slurp(f) {
  return require('fs').readFileSync(f, 'utf-8');
}

function time_ms() { return new Date().getTime(); }

function assoc(src) {
  var m = types._clone(src);
  var args = [m].concat(slicer.call(arguments, 1));
  return types._assoc_BANG.apply(null, args);
}

function dissoc(src) {
  var m = types._clone(src);
  var args = [m].concat(slicer.call(arguments, 1));
  return types._dissoc_BANG.apply(null, args);
}

function get(m, key) {
  return (m !== null && key in m) ? m[key] : null;
}

function contains_Q(m, key) {
  return (key in m);
}

function vals(m) { return Object.values(m); }
function keys(m) { return Object.keys(m); }

function cons(a, b) { return [a].concat(b); }

function concat(lst) {
  lst = lst || [];
  return lst.concat.apply(lst, slicer.call(arguments, 1));
}

function nth(lst, idx) {
  return (idx < lst.length) ?
    lst[idx] : types.raise_BANG("nth: index out of range");
}

function first(lst) {
  return (lst === null) ? null : lst[0]; }

function rest(lst) {
  return (lst == null) ? [] : lst.slice(1); }

function empty_Q(lst) { return lst.length === 0; }

function count(s) {
  if (type._array_Q(s) ||
      type._string_Q(s)) { return s.length; }
  else if (s === null) { return 0; }
  else if (type._object_Q(s)) {
    return Object.keys(s).length; }
  else return 0;
}

function conj(lst) {
  if (types._list_Q(lst)) {
    return slicer.call(arguments, 1).
      reverse().concat(lst);
  } else {
    var v = lst.concat(slicer.call(arguments, 1));
    v.__isvector__ = true;
    return v;
  }
}

function seq(obj) {
  if (types._list_Q(obj)) {
    return obj.length > 0 ? obj : null;
  }
  if (types._vector_Q(obj)) {
    return obj.length > 0 ? slicer.call(obj, 0): null;
  }
  if (types._string_Q(obj)) {
    return obj.length > 0 ? obj.split('') : null;
  }
  if (obj === null) {
    return null;
  }
  types.raise_BANG("seq: called on non-sequence");
}

function apply(f) {
  var args = slicer.call(arguments, 1);
  return f.apply(f,
    args.
    slice(0, args.length-1).
    concat(args[args.length-1]));
}

function map(f, lst) {
  return lst.map(function(el){ return f(el); });
}

function with_meta(obj, m) {
  var new_obj = types._clone(obj);
  new_obj.__meta__ = m;
  return new_obj;
}

function meta(obj) {
  // TODO: support symbols and atoms
  if ((!types._sequential_Q(obj)) &&
      (!(types._hash_map_Q(obj))) &&
      (!(types._function_Q(obj)))) {
    types.raise_BANG("attempt to get metadata from: " +
      types._obj_type(obj));
  }
  return obj.__meta__;
}

function deref(atm) { return atm.val; }
function reset_BANG(atm, val) {
  return atm.val = val; }
function swap_BANG(atm, f) {
  var args = [atm.val].concat(
    slicer.call(arguments, 2));
  atm.val = f.apply(f, args);
  return atm.val;
}

function js_eval(str) {
  return interop.js_to_mal(eval(str.toString()));
}

function js_method_call(object_method_str) {
  var args = slicer.call(arguments, 1),
      r = interop.resolve_js(object_method_str),
      obj = r[0], f = r[1];
  var res = f.apply(obj, args);
  return interop.js_to_mal(res);
}

// types.ns is namespace of type functions
var ns = {'type': types._obj_type,
          '=': types._equal_Q,
          'throw': mal_throw,
          'nil?': types._nil_Q,
          'true?': types._true_Q,
          'false?': types._false_Q,
          'string?': types._string_Q,
          'symbol': types._symbol,
          'symbol?': types._symbol_Q,
          'keyword': types._keyword,
          'keyword?': types._keyword_Q,

          'pr-str': pr_str,
          'str': str,
          'prn': prn,
          'println': println,
          'readline': readline.readline,
          'read-string': reader.read_str,
          'slurp': slurp,
          '<'  : function(a,b){return a<b;},
          '<=' : function(a,b){return a<=b;},
          '>'  : function(a,b){return a>b;},
          '>=' : function(a,b){return a>=b;},
          '+'  : function(a,b){return a+b;},
          '-'  : function(a,b){return a-b;},
          '*'  : function(a,b){return a*b;},
          '/'  : function(a,b){return a/b;},
          "time-ms": time_ms,

          'list': types._list,
          'list?': types._list_Q,
          'vector': types._vector,
          'vector?': types._vector_Q,
          'hash-map': types._hash_map,
          'map?': types._hash_map_Q,
          'assoc': assoc,
          'dissoc': dissoc,
          'get': get,
          'contains?': contains_Q,
          'keys': keys,
          'vals': vals,

          'sequential?': types._sequential_Q,
          'cons': cons,
          'concat': concat,
          'nth': nth,
          'first': first,
          'rest': rest,
          'empty?': empty_Q,
          'count': count,
          'apply': apply,
          'map': map,

          'conj': conj,
          'seq': seq,

          'with-meta': with_meta,
          'meta': meta,
          'atom': types._atom,
          'atom?': types._atom_Q,
          "deref": deref,
          "reset!": reset_BANG,
          "swap!": swap_BANG,

  "raise!" : types.raise_BANG,
  "slice" : slice,
  "functor" : functor,

          'js-eval': js_eval,
          '.': js_method_call
};

exports.ns = core.ns = ns;
