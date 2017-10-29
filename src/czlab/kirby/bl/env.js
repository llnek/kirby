/*Auto generated by Kirby - v1.0.0 czlab.kirby.bl.env Sat Oct 28 2017 18:20:54 GMT-0700 (PDT)*/

var std= require("./stdlib");
var types= require("./types");
;
let Symbol;
Symbol= types.Symbol;
;
//
function Env(parent,vars,exprs) {
this.parent = std.maybe(parent,null);
this.data = {};
((vars&&exprs) ?
    (function() {
  return (function () {let ____break=false;
for (let i = 0,e = null; (!____break && (i < vars.length)); i = (i+1)) {
        e = vars[i].value;
    (("&" === e) ?
            (function() {
      this.data[vars[(i+1)].value] = exprs.slice(i);
      return ____break = true;
      }).call(this) :
      (e.startsWith("&") ?
                (function() {
        this.data[e.slice(1)] = exprs.slice(i);
        return ____break = true;
        }).call(this) :
        (true ?
          this.data[e] = exprs[i] :
          null)));
;
  }
}).call(this);
  }).call(this) :
  null);
return this;
}

;
//
Env.prototype.find = function (key) {
((key instanceof Symbol) ?
  null :
  (function (){ throw new Error([ "env.xxx key must be a symbol" ].join("")); }).call(this));
return (std.contains_QUERY(this.data,key.value) ?
  this :
  (std.some_QUERY(this.parent) ?
    this.parent.find(key) :
    null));
}

//
Env.prototype.set = function (key,value) {
((key instanceof Symbol) ?
  null :
  (function (){ throw new Error([ "env.xxx key must be a symbol" ].join("")); }).call(this));
this.data[key.value] = value;
return value;
}

//
Env.prototype.get = function (key) {
((key instanceof Symbol) ?
  null :
  (function (){ throw new Error([ "env.xxx key must be a symbol" ].join("")); }).call(this));
let env;
env= this.find(key);
;
(env ?
  null :
  (function (){ throw new Error([ key.value,"' not found" ].join("")); }).call(this));
return env.data[key.value];
}



module.exports = {
  Env: Env
};

