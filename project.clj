;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
(defproject io.czlab/kirby "1.0.0"

  :license {:url "http://www.eclipse.org/legal/epl-v10.html"
            :name "Eclipse Public License"}

  :description ""
  :url "https://github.com/llnek/kirby"

  :dependencies []

  :plugins [[lein-shell "0.5.0"]]

  :profiles {:provided {:dependencies [[org.clojure/clojure
                                        "1.9.0" :scope "provided"]]}
             :uberjar {:aot :all}}

  :global-vars {*warn-on-reflection* true}
  :target-path "out/%s"
  :aot :all

  :coordinate! "czlab"
  :omit-source true

  :aliases {"deploy" ["with-profile"
                      "podify" "wabbit"]
            "compile" ["shell" "bin/build"]
            "run" ["trampoline"
                   "run" "-m" "czlab.wabbit.core"]}

  )

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

