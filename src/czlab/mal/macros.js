
var loaded_Q=false;
var cache= {};

function load() {
  loaded_Q=true;
  require("./macros.kirby");
}

module.exports= {
  load: load,
  CACHE: cache,
  loaded_Q : loaded_Q
};

