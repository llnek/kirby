// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var core=require("./core");

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function Env(outer, binds, exprs) {
  this.outer = outer || null;
  this.data = {};

  if (binds && exprs) {
    for (var i=0; i<binds.length; ++i) {
      if (binds[i].value === "&") {
        this.data[binds[i+1].value] = core.slice(exprs, i);
        break;
      }
      if (binds[i].value.startsWith("&")) {
        this.data[ binds[i].value.slice(1)] = core.slice(exprs, i);
        break;
      }
      this.data[binds[i].value] = exprs[i];
    }
  }
  return this;
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Env.prototype.find = function (key) {
  if (! key instanceof Symbol) {
    throw new Error("env.find key must be a symbol");
  }
  if (key.value in this.data) { return this; }
  if (this.outer) {  return this.outer.find(key); }
  return null;
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Env.prototype.set = function(key, value) {
  if (! key instanceof Symbol ) {
    throw new Error("env.set key must be a symbol");
  }
  this.data[key.value] = value;
  return value;
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Env.prototype.get = function(key) {
  if (! key instanceof Symbol) {
    throw new Error("env.get key must be a symbol");
  }
  let env = this.find(key);
  if (!env) { throw new Error("'" + key.value + "' not found"); }
  return env.data[key.value];
};

module.exports= {
  Env : Env
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

