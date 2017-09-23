var printer = {};
var types = require('./types');
printer.println = exports.println = function () {
  console.log.apply(console, arguments);
};

function _pr_str(obj, print_readably) {
  if (typeof print_readably === 'undefined') {
    print_readably = true; }
  var _r = print_readably;
  var ot = types._obj_type(obj);
  switch (ot) {
    case "list":
      var ret = obj.map(function(e) {
        return _pr_str(e,_r); });
      return "(" + ret.join(' ') + ")";
    case "vector":
      var ret = obj.map(function(e) {
        return _pr_str(e,_r); });
      return "[" + ret.join(' ') + "]";
    case "hash-map":
      var ret = [];
      for (var k in obj) {
        ret.push(_pr_str(k,_r),
          _pr_str(obj[k],_r));
      }
      return "{" + ret.join(' ') + "}";
    case "string":
      if (_r) {
        return '"' +
          obj.replace(/\\/g, "\\\\").
          replace(/"/g, '\\"').
          replace(/\n/g, "\\n") + '"';
      } else {
        return obj;
      }
    case "keyword":
      return ":" + obj.toString();
    case "nil":
      return "nil";
    case "atom":
      return "(atom " + _pr_str(obj.value,_r) + ")";
    default:
      return obj.toString();
  }
}

exports._pr_str = printer._pr_str = _pr_str;

