/*Auto generated by Kirby - v1.0.0  - Mon Nov 06 2017 20:53:32 GMT-0800 (PST)*/

(function () {
let recur,xs,f,ret;
recur= null;
xs= null;
f= function (a,b) {
;return (((a+b) > 10) ?
(function() {
console.log("done");
;return 1;
}).call(this) :
(function() {
console.log("a=",a,", b=",b);
;return recur((a+1),(b+1));
}).call(this));
};
ret= f;
;;
recur=function () {
xs=arguments;
if (ret) {for(ret=undefined;ret===undefined;){ret=f.apply(this,xs);} return ret;};
;return undefined;
};
;return recur(1,1);
})(this)
