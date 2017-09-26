var TreeNode= require("source-map").SourceNode;

function tnode(source, line, col, chunk, name, type) {
  let argsQ = arguments.length > 0,
    n=null;
  if (argsQ) {
    if (name) {
      n=new TreeNode(line, col, source, chunk, name);
    } else {
      n=new TreeNode(line, col, source, chunk);
    }
  } else {
    n= new TreeNode();
  }
  return n;
}

function tnodeEx(chunk, name, type) {
  return tnode(null,null,null,chunk, name, type);
}

exports.tnode=tnode;
exports.tnodeEx=tnodeEx;


