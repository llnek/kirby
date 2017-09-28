
var loaded_Q=false;
var cache= {};

function load() {
  loaded_Q=true;
  require("./macros.kirby");
}

function set(cmd, func) {
  if (cmd && func) CACHE[cmd]=func;
}

function get(x) {
  return x ? CACHE[x] : undefined;
}

module.exports= {
  load: load,
  set: set,
  get: get,
  CACHE: cache,
  loaded_Q : loaded_Q
};

