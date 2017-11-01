/*Auto generated by Kirby - v1.0.0 czlab.kirby.bl.env Wed Nov 01 2017 03:55:55 GMT-0700 (PDT)*/

var std = require("./stdlib");
var types = require("./types");
var Symbol = types["Symbol"];


class LEXEnv {
  constructor(parent, vars, exprs) {
    this["data"] = {}, this["parent"] = std.opt(parent, null);
    (
    (vars && exprs) ?
      (function() {
        return (function() {
          for (let i = 0, e = null, ev = null, ____break = false; ((!____break) && (i < vars.length)); i = (i + 1)) {
            e = vars[i], ev = e.value;
            (
            (ev === "&") ?
              (function() {
                this.data[vars[(i + 1)].value] = Array.prototype.slice.call(exprs, i);
                return ____break = true;
              }).call(this) :
              (ev.startsWith("&") ?
                (function() {
                  this.data[ev.slice(1)] = Array.prototype.slice.call(exprs, i);
                  return ____break = true;
                }).call(this) :
                (true ?
                  this.data[ev] = exprs[i] :
                  null)));
          }
        })(this);

      }).call(this) :
      null);
    return this;
  }

  find(k) {
    (
    (!(k instanceof Symbol)) ?
      (function() {
        throw new Error("env.xxx key must be a symbol");
      }).call(this) :
      null);
    return (std.contains_QUERY(this.data, key.value) ?
      this :
      (std.some_QUERY(this.parent) ?
        this.parent.find(k) :
        null));
  }

  set(k, v) {
    (
    (!(k instanceof Symbol)) ?
      (function() {
        throw new Error("env.xxx key must be a symbol");
      }).call(this) :
      null);
    this.data[k.value] = v;
    return v;
  }

  get(k) {
    (
    (!(k instanceof Symbol)) ?
      (function() {
        throw new Error("env.xxx key must be a symbol");
      }).call(this) :
      null);
    let env;
    env = this.find(k);

    (
    (!env) ?
      (function() {
        throw new Error([k.value, " not found"].join(""));
      }).call(this) :
      null);
    return env.data[k.value];
  }

}

