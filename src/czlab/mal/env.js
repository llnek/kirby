var env = {};

function Env(outer, binds, exprs) {
  this.data = {};
  this.outer = outer || null;
  if (binds && exprs) {
    for (var i=0; i<binds.length;i++) {
      if (binds[i].value === "&") {
        this.data[binds[i+1].value] =
          slice(exprs, i);
        break;
      }
      else
      if (binds[i].value.startsWith("&")) {
        this.data[
          binds[i].value.slice(1) ] = slice.call(exprs, i);
        break;
      }
      else {
        this.data[binds[i].value] = exprs[i];
      }
    }
  }
  return this;
}

Env.prototype.find = function (key) {
  if (!key.constructor ||
    key.constructor.name !== "Symbol") {
    raise_BANG("env.find key must be a symbol");
  }
  if (key.value in this.data) { return this; }
  else if (this.outer) {  return this.outer.find(key); }
  else { return null; }
};

Env.prototype.set = function(key, value) {
  if (!key.constructor ||
    key.constructor.name !== "Symbol") {
    raise_BANG("env.set key must be a symbol");
  }
  this.data[key.value] = value;
  return value;
};

Env.prototype.get = function(key) {
  if (!key.constructor ||
    key.constructor.name !== "Symbol") {
    raise_BANG("env.get key must be a symbol");
  }
  var env = this.find(key);
  if (!env) { raise_BANG("'" + key.value + "' not found"); }
  return env.data[key.value];
};

exports.Env = env.Env = Env;

