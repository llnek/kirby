// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
"use strict";
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var types=require("./types");
var std=require("./stdlib");
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
function Env(outer, binds, exprs) {
  this.outer = outer || null;
  this.data = {};
  this.nspaces=[];

  if (binds && exprs) {
    for (var i=0; i<binds.length; ++i) {
      if (binds[i].value === "&") {
        this.data[binds[i+1].value] = std.slice(exprs, i);
        break;
      }
      if (binds[i].value.startsWith("&")) {
        this.data[ binds[i].value.slice(1)] = std.slice(exprs, i);
        break;
      }
      this.data[binds[i].value] = exprs[i];
    }
  }
  return this;
}

//var STAR_NS_STAR= types.symbol("*ns*");
Env.prototype.pushNSP=function(nsp) {
  this.nspaces.push(""+nsp);
}
Env.prototype.peekNSP=function() {
  return this.nspaces[this.nspaces.length-1];
}
Env.prototype.popNSP=function() {
  return this.nspaces.pop();
}
Env.prototype.firstNSP=function() {
  return this.nspaces[0];
}
Env.prototype.resetNSPCache=function() {
  this.nspaces=[];
}
Env.prototype.countNSPCache=function() {
  return this.nspaces.length;
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
  //if (!env) { std.println("'"+key.value+ "' not found"); }
  return env ? env.data[key.value] : key.value;
};

module.exports= {
  Env : Env
};

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

