var types = {};

function raise_BANG(msg) {
  throw new Error(msg);
}
function trap_BANG(msg) {
  throw msg;
}

function _obj_type(obj) {
  if (_keyword_Q(obj)) { return "keyword"; }
  if (_symbol_Q(obj)) {   return "symbol"; }
  if (_list_Q(obj)) {     return "list"; }
  if (_vector_Q(obj)) {   return "vector"; }
  if (_hash_map_Q(obj)) { return "hash-map"; }
  if (_nil_Q(obj)) {      return "nil"; }
  if (_true_Q(obj)) {     return "true"; }
  if (_false_Q(obj)) {    return "false"; }
  if (_atom_Q(obj)) {     return "atom"; }
  else {
    switch (typeof(obj)) {
    case "number":   return "number";
    case "function": return "function";
    case "string": return "string";
    default:
        raise_BANG("Unknown type '" +
          typeof(obj) + "'");
    }
  }
}

function _sequential_Q(lst) {
  return _list_Q(lst) || _vector_Q(lst); }

function _equal_Q (a, b) {
  var ota = _obj_type(a),
    otb = _obj_type(b);

  if (!(ota === otb ||
       (_sequential_Q(a) && _sequential_Q(b)))) {
    return false;
  }
  switch (ota) {
    case "symbol": return a.value === b.value;
    case "list":
    case "vector":
      if (a.length !== b.length) { return false; }
      for (var i=0; i<a.length; i++) {
        if (! _equal_Q(a[i], b[i])) {
          return false; }
      }
      return true;
    case "hash-map":
      if (Object.keys(a).length !== Object.keys(b).length) { return false; }
      for (var k in a) {
        if (! _equal_Q(a[k], b[k])) {
          return false; }
      }
      return true;
    default:
      return a === b;
  }
}

function _clone (obj) {
  var new_obj;
  switch (_obj_type(obj)) {
    case "list":
      new_obj = obj.slice(0);
      break;
    case "vector":
      new_obj = obj.slice(0);
      new_obj.__isvector__ = true;
      break;
    case "hash-map":
      new_obj = {};
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) { new_obj[k] = obj[k]; }
      }
      break;
    case "function":
      new_obj = obj.clone();
      break;
    default:
      raise_BANG("clone of non-collection: " +
        _obj_type(obj));
  }
  Object.defineProperty(new_obj, "__meta__", {
    enumerable: false,
    writable: true
  });
  return new_obj;
}

function _nil_Q(a) { return a === null; }
function _true_Q(a) { return a === true; }
function _false_Q(a) { return a === false; }
function _string_Q(obj) {
  return typeof obj === "string";
}

function Symbol(name) {
  this.value = name;
  return this;
}
Symbol.prototype.toString = function() {
  return this.value; }
function _symbol(name) { return new Symbol(name); }
function _symbol_Q(obj) { return obj instanceof Symbol; }

function Keyword(name) {
  this.value = name;
  return this;
}
Keyword.prototype.toString = function() {
  return this.value; }
function _keyword(name) { return new Keyword(name); }
function _keyword_Q(obj) {
  return obj instanceof Keyword; }

function _function(Eval, Env, ast, env, params) {
  var fn = function() {
    return Eval(ast,
      new Env(env, params, arguments));
  };
  fn.__meta__ = null;
  fn.__ast__ = ast;
  fn.__gen_env__ = function(args) {
    return new Env(env, params, args); };
  fn._ismacro_ = false;
  return fn;
}

function _function_Q(obj) {
  return typeof obj == "function"; }

Function.prototype.clone = function() {
  var that = this;
  var temp = function () {
    return that.apply(this, arguments); };
  for( key in this ) {
    temp[key] = this[key];
  }
  return temp;
};

var slicer=Array.prototype.slice;
function slice(coll,s,e) {
  return e ? slicer.call(coll,s,e) : slicer.call(coll,s);
}

function _array_Q(obj) {
  return Array.isArray(obj); }

function _list() { return slice(arguments, 0); }
function _list_Q(obj) {
  return Array.isArray(obj) && !obj.__isvector__; }

function _vector() {
  var v = slice(arguments, 0);
  v.__isvector__ = true;
  return v;
}
function _vector_Q(obj) {
  return Array.isArray(obj) && !!obj.__isvector__; }

function _hash_map() {
  if (arguments.length % 2 === 1) {
    raise_BANG("Odd number of hash map args");
  }
  var args = [{}].concat(slice(arguments, 0));
  return _assoc_BANG.apply(null, args);
}

function _object_Q(hm) {
    return typeof hm === "object" &&
           !Array.isArray(hm) &&
           !(hm === null);
}

function _hash_map_Q(hm) {
    return _object_Q(hm) &&
           !(hm instanceof Symbol) &&
    !(hm instanceof Keyword) &&
           !(hm instanceof Atom);
}

function _assoc_BANG(hm) {
  if (arguments.length % 2 !== 1) {
    raise_BANG("Odd number of assoc args");
  }
  for (var i=1; i<arguments.length; i+=2) {
    var ktoken = arguments[i],
        vtoken = arguments[i+1];
    if (typeof ktoken !== "string") {
      raise_BANG("expected hash-map key string, got: " + (typeof ktoken));
    }
    hm[ktoken] = vtoken;
  }
  return hm;
}

function _dissoc_BANG(hm) {
  for (var i=1; i<arguments.length; i++) {
    var ktoken = arguments[i];
    delete hm[ktoken];
  }
  return hm;
}

function Atom(val) { this.value = val; }
function _atom(val) { return new Atom(val); }
function _atom_Q(atm) { return atm instanceof Atom; }


// Exports
exports._obj_type = types._obj_type = _obj_type;
exports._sequential_Q = types._sequential_Q = _sequential_Q;
exports._equal_Q = types._equal_Q = _equal_Q;
exports._clone = types._clone = _clone;
exports._slice= types.slice = slice;
exports._nil_Q = types._nil_Q = _nil_Q;
exports._true_Q = types._true_Q = _true_Q;
exports._false_Q = types._false_Q = _false_Q;
exports._string_Q = types._string_Q = _string_Q;
exports._symbol = types._symbol = _symbol;
exports._symbol_Q = types._symbol_Q = _symbol_Q;
exports._keyword = types._keyword = _keyword;
exports._keyword_Q = types._keyword_Q = _keyword_Q;
exports._function = types._function = _function;
exports._function_Q = types._function_Q = _function_Q;
exports._list = types._list = _list;
exports._list_Q = types._list_Q = _list_Q;
exports._array_Q = types._array_Q = _array_Q;
exports._vector = types._vector = _vector;
exports._vector_Q = types._vector_Q = _vector_Q;
exports._hash_map = types._hash_map = _hash_map;
exports._hash_map_Q = types._hash_map_Q = _hash_map_Q;
exports._object_Q = types._object_Q = _object_Q;
exports._assoc_BANG = types._assoc_BANG = _assoc_BANG;
exports._dissoc_BANG = types._dissoc_BANG = _dissoc_BANG;
exports._atom = types._atom = _atom;
exports._atom_Q = types._atom_Q = _atom_Q;


