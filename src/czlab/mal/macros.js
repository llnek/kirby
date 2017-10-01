
var loaded_Q=false;
var CACHE= {};

function load() {
  loaded_Q=true;
  require("./macros.kirby");
}

function set(cmd, func) {
  if (cmd && func) {
    //console.log("adding macro ==== " + cmd);
    CACHE[cmd]=func;
  }
}

function get(x) {
  return x ? CACHE[x] : undefined;
}

module.exports= {
  load: load,
  set: set,
  get: get,
  loaded_Q : loaded_Q
};

