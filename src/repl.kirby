;; A very simple REPL written in LispyScript

(require "./require")
(def readline (require "readline")
     ls (require "../lib/ls")
     prefix "lispy> ")

(set! exports.runrepl
  (#
    (var rl (readline.createInterface process.stdin process.stdout))
    (rl.on 'line'
      (fn (line)
        (try
          (var l (ls.transpile line))
          (console.log (this.eval l))
          (catch err
            (console.log err)))
        (rl.setPrompt prefix prefix.length)
        (rl.prompt)))
    (rl.on 'close'
      (#
        (console.log "Bye!")
        (process.exit 0)))
    (console.log (str prefix 'LispyScript REPL v' ls.version))
    (rl.setPrompt prefix prefix.length)
    (rl.prompt)))

