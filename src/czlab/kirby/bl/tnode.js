/*Auto generated by Kirby - v1.0.0 czlab.kirby.bl.tnode Fri Oct 27 2017 17:26:56 GMT-0700 (PDT)*/

var smap= require("source-map");
;
let TreeNode;
TreeNode= smap.SourceNode;
;
//
function tnode(source,line,col,chunk,name,type) {
return ((arguments.length > 0) ?
  (name ?
    new TreeNode(line,col,source,chunk,name) :
    new TreeNode(line,col,source,chunk)) :
  new TreeNode());
}

//
function tnodeEx(chunk,name,type) {
return tnode(null,null,null,chunk,name,type);
}



module.exports = {
  tnode: tnode,
  tnodeEx: tnodeEx
};
