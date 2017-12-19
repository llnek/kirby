// Copyright (c) 2013-2017, Kenneth Leung. All rights reserved.
// The use and distribution terms for this software are covered by the
// Eclipse Public License 1.0 (http:;;opensource.org;licenses;eclipse-1.0.php)
// which can be found in the file epl-v10.html at the root of this distribution.
// By using this software in any fashion, you are agreeing to be bound by
// the terms of this license.
// You must not remove this notice, or any other, from this software.
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
"use strict";

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
var identity= {
  bind : function(mv,mf) { return mf(mv); },
  result : function(v) { return v;}
};

var maybe = {
  bind :  function(mv, mf) { return mv===null ? null : mf(mv); },
  result : function(v) { return v; },
  zero : null
};

var array= {
  bind: function(mv, mf) {
    return mv.map(mf).reduce(function(acc,v){
      return acc.concat(v);
    }, []);
  },
  result: function(v) { return [v]; },
  zero: [],
  plus: function () {
    return Array.prototype.slice.call(arguments).reduce(function(acc,v) {
        return acc.concat(v);
    }, []);
  }
};

var state = {
  bind: function(mv, mf) {
    return function(s) {
      let x= mv(s), v= x[0], ss= x[1];
      return mf(v)(ss);
    }
  },
  result: function(v) {
    return function(s) { return  [v, s]; };
  }
};

var continuation= {
  bind: function(mv, mf) {
    return function(c) {
      return mv(function(v) { return mf(v)(c); });
    }
  },
  result: function(v) { return function(c) { return c(v); }}
};

function resultFunc(monad) {
  let body=Array.prototype.slice.call(arguments,1);
  return (monad.zero && body.length === 0) ?
    monad.zero : monad.result.apply(this, body);
}

module.exports= {
  resultWrapperFunc: resultFunc,
  identity : identity,
  state : state,
  maybe: maybe,
  array: array,
  continuation: continuation
}

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

