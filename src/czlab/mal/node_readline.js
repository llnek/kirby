var readline= require("readline"),
    prefix= "kirby> ";

var runrepl=function() {
  let rl= readline.createInterface(
            process.stdin, process.stdout);
  rl.on("line",
    function(line) {
      try {
        let l= ls.transpile(line);
        console.log(this.eval(l));
      } catch (err) {
        console.log(err);
      }
      rl.setPrompt(prefix, prefix.length);
      rl.prompt();
    });

  rl.on("close",
    function() {
      console.log("Bye!");
      process.exit(0);
    });

  console.log(prefix + "Kirby REPL v1.0.0");
  rl.setPrompt(prefix, prefix.length);
  rl.prompt();
}


