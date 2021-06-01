import reader as rdr
import stdlib as std
import engine as eng
import sys

##############################################################################
GET_INDEX= eng.KBSTDLR+ ".getIndex"
GET_PROP= eng.KBSTDLR + ".getProp"
KEYW=  eng.KBSTDLR + ".keyword"
SYMB=  eng.KBSTDLR + ".symbol"
COUNT=  eng.KBSTDLR + ".count"
REM_DIV= eng.KBSTDLR+ ".rem"

##############################################################################
STAR_LAST_LINE_STAR=0
STAR_LAST_COL_STAR=0
SPEC_OPS={}
LARGS="____args"
##############################################################################
def tnode_ex(name, chunk):
  return tnode(None,None,None,chunk,name)
##############################################################################
def tnode(src=None,ln=None,col=None,chunk=None,name=None):
  return rdr.SNode(ln if ln else 0,
                   col if col else 0,
                   src if src else None,
                   chunk if chunk else None,
                   name if name else None)
##############################################################################
def mk_node(ast, obj=None):
  if not obj:
    obj=tnode()
  obj.source= ast.source
  obj.line= ast.line
  obj.column= ast.column
  return obj
##############################################################################
def xfi(src,to):
  if src and to and not is_simple(to) and not std.is_number(to.line) and std.is_number(src.line):
    to.source= src.source
    to.line=src.line
    to.column=src.column
  return to
##############################################################################
def is_simple(ast):
  return ast==None or std.is_string(ast) or std.is_number(ast) or std.is_bool(ast)
##############################################################################
def is_stmt(ast):
  if is_simple(ast):
    raise Exception("syntax-error"+str(ast))
  return ast.expr==False
##############################################################################
def gcmd(ast):
  s=""
  if std.is_map(ast):
    s="hash-map"
  elif std.is_vector(ast):
    s= "vec"
  elif std.is_set(ast):
    s= "hash-set"
  elif std.is_list(ast):
    s= "list"
  elif std.is_sexpr(ast) and ast.value and not std.is_sexpr(ast.value[0]):
    s=str(ast.value[0])
  return s
##############################################################################
def spread_info(src,to):
  if src and not is_simple(src) and std.is_number(src.line) and std.is_complex(to):
    xfi(src,to)
    for _,x in enumerate(to.value):
      spread_info(src,x)
  else:
    xfi(src,to)
##############################################################################
def expr_hint(ast,flag):
  #if ast is a simple-ton, wrap (box) it with a Primitive object
  ret=ast
  if is_simple(ast):
    ret= std.to_primitive(ast)
  ret.expr=flag
  return ret
##############################################################################
def unmangle(s):
  if s:
    s= ".".join([rdr.jsid(x) for x in s.split(".")])
  return s
##############################################################################
def is_meta(obj):
  return std.is_sexpr(obj) and len(obj.value)==3 and std.is_symbol(obj.value[0]) and "with-meta"== str(obj.value[0])
##############################################################################
def eval_meta(m,env):
  return m
##############################################################################
def metaQQ(obj,env):
  m=None
  o=obj
  if is_meta(obj):
    m=obj.value[1]
    o=obj.value[2]
    o.meta=eval_meta(m,env)
    m=o.meta
  return (m,o)
##############################################################################
def slibBANG(cmd):
  nsp=std.peek_nsp()
  lib= ""+ eng.KBSTDLR +"."
  cmd=str(cmd)
  if cmd.startswith(lib) and nsp and nsp.get("id") == eng.KBSTDLIB:
    cmd=cmd[len(lib):]
  return cmd
##############################################################################
def testreQ(re,x):
  return re.search(x) if x else False
##############################################################################
def fnQQ(cmd):
  return "("+cmd+")" if testreQ(rdr.RX_FUNC, cmd) else cmd
##############################################################################
def tx_pairs(ast,env):
  nsp= std.peek_nsp()
  stmtQ= is_stmt(ast)
  ret= mk_node(ast)
  cmd= gcmd(ast)
  e1= std.first(ast)
  orig= ast
  op=None
  tmp=None
  mc= eng.get_macro(cmd)
  xfi(e1, ret)
  xfi(e1, ast)
  #always handle macro calls first
  if mc:
    ast= eng.expandQQ(ast,env,mc)
    ast= xfi(orig, expr_hint(ast, not stmtQ))
    spread_info(orig,ast)
    cmd= gcmd(ast)
  #handle (+1 ) or (-1 ) cases
  if rdr.RX_INT.search(cmd):
    if not (cmd.startswith("+") or cmd.startswith("-")):
      cmd="+"+cmd
    ast= xfi(ast, std.CList([std.to_symbol(cmd[0]),std.second(ast), int(cmd[1:])]))
    cmd= str(std.first(ast))
  #maybe special form
  op= SPEC_OPS.get(cmd)
  #handle all cases
  if cmd== "with-meta":
    ret.add(tx_ex(metaQQ(ast,env)[1]), env)
  elif cmd.startswith(".-"):
    ret.add([tx_ex(ast.value[1], env),".",tx_ex(std.to_symbol(cmd[2:]), env)])
  elif cmd.startswith(".@"):
    ret.add([tx_ex(ast.value[1],env),
             "[",
             cmd[3 if cmd.startswith(".@+") else 2:],
             "+1" if cmd.startswith(".@+") else "", "]"])
  elif cmd.startswith("."):
    ret.add([tx_ex(ast.value[1], env),
             tx_ex(std.to_symbol(cmd), env),
             "(",
             ",".join([tx_ex(x,env) for x in ast.value[2:]]), ")"])
  elif op:
    ret=op(ast,env)
  elif (cmd== "splice-unquote" or cmd== "unquote" or cmd== "syntax-quote") and (not nsp.get("id").startswith(KBPFX)):
    raise Exception("Outside macros"+str(ast))
  else:
    if ast.isPair():
      try:
        xxxx=tx_form(ast,env)
        cmd=str(xxxx.value[0])
      except Exception as err:
        raise Exception("poo")
    else:
      cmd=tx_ex(ast,env)
    if not cmd:
      raise Exception("Emptp form")
    cmd= slibBANG(cmd)
    ret.add(cmd if not ast.isPair() else [fnQQ(cmd),"(",",".join(ast.value[1:]),")"])
  return mk_node(ast, ret)
##############################################################################
def tx_form(expr,env):
  if type(expr.value)==list:
    z=len(expr.value)
    i=0
    while i<z:
      expr.value[i]= tx_ex(expr.value[i],env)
      i +=1
  return expr
##############################################################################
def tx_atom(a):
  s=str(a)
  ret=None
  if std.is_lambda_arg(a):
    ret=f"{LARGS}[{int(s[1:])-1}]"
  elif std.is_regex_obj(a):
    ret=mk_node(a, tnode_ex(s, s[1:]))
  elif std.is_keyword(a):
    ret=mk_node(a, tnode_ex(s, std.quote_str(s)))
  elif std.is_symbol(a):
    ret=mk_node(a, tnode_ex(s, unmangle(s)))
  elif a==None:
    ret="None"
  elif std.is_primitive(a):
    a=a.value
    s=str(a)
    if std.is_string(a):
      ret=std.quote_str(a)
    elif a==None:
      ret="None"
    else:
      ret=s
  elif std.is_string(a):
    ret= std.quote_str(a)
  else:
    ret= rdr.jsid(s)
  return ret
##############################################################################
def tx_ex(ast,env):
  return tx_atom(ast) if is_simple(ast) or ast.isAtom() else tx_pairs(ast,env)
##############################################################################
def tx_tree(root,env):
  n1=root[0] if root else None
  ret= tnode()
  ms=[]
  os=[]
  try:
    if False and "ns" != str(n1.value[0]):
      raise Exception("?")
  except:
      raise Exception("(ns ...) must be first form in file")

  for i,v in enumerate(root):
    if i==0:
      ms.append(v)
    else:
      if std.is_list(v) and std.not_empty(v.value) and std.is_symbol(std.first(v.value)) and "defmacro"== str(std.first(v.value)):
        ms.append(v)
      else:
        os.append(v)
  #endfor
  def _f(r):
    r=r
    STAR_LAST_LINE_STAR= r.line
    STAR_LAST_COL_STAR=r.column
    t=tx_ex(r,env)
    if t:
      ret.add(t)
  for _,x in enumerate(ms):
    _f(x)
  for _,x in enumerate(os):
    _f(x)
  return ret
##############################################################################
def transpile(source,fname):
  ast= rdr.parse(source,fname)
  for x in ast:
    assert isinstance(x,std.CBase), "Oh man!"
  #print(len(ast))
  print("\n".join(map(lambda x: str(x), ast)))
  ret=tx_tree(ast,None)
  print(str(ret))
##############################################################################
def assert_arity(kond,ast):
  if not kond:
    raise Exception("Invalid Arity: " + str(ast))
  assert_info(ast)
##############################################################################
def assert_info(ast):
  pass
##############################################################################
def wrap(ret,head,tail):
  if ret:
    if head:
      ret.prepend(head)
    if tail:
      ret.add(tail)
  return ret

##############################################################################
def quote_single(a):
  ret=None
  if std.is_keyword(a):
    ret= slibBANG(KEYW)+"(\""+ str(a.value) + "\")"
  elif std.is_symbol(a):
    ret= slibBANG(SYMB)+ "(\""+ str( a.value)+ "\")"
  elif std.is_primitive(a):
    a=a.value
    if type(a)==str:
      ret=std.quote_str(a)
    elif a==None:
      ret="nil"
    elif a==True:
      ret="true"
    elif a==False:
      ret="false"
    else:
      ret=str(a)
  elif type(a)==str:
    ret=std.quote_str(a)
  else:
    ret=str(a)
  return ret
##############################################################################
def quote_map(ast,env):
  cma=""
  ret=mk_node(ast)
  i=0
  end=std.count(ast)
  while i<end:
    if i>0:
      ret.add(",")
    ret.add([quoteBANG(ast.value[i],env), " , ", quoteBANG(ast.value[i+1],env)])
    i += 2
  if end>0:
    cma=","
  return wrap(ret, ["[",slibBANG(SYMB), "(\"hash-map\")", cma], "]")
##############################################################################
def quote_block(ast,env):
  cma= "," if std.count(ast)>0 else ""
  ret=mk_node(ast)
  for i,x in enumerate(ast.value):
    if i> 0:
      ret.add( ",")
    ret.add(quoteBANG(x,env))
  if std.is_map(ast):
    wrap(ret, ["(",slibBANG(SYMB), "(\"hash-map\")", cma], ")")
  elif std.is_vector(ast):
    wrap(ret, "[","]")
  elif std.is_set(ast):
    wrap(ret, ["(",slibBANG(SYMB), "(\"hash-set\")", cma], ")")
  else:
    wrap(ret, ["(",slibBANG(SYMB), "(\"list\")", cma], ")")
  return ret
##############################################################################
def quoteBANG(ast,env):
  ret=None
  if std.is_map(ast) or std.is_list(ast) or std.is_vector(ast) or std.is_set(ast) or std.is_sexpr(ast):
    ret=quote_block(ast,env)
  else:
    ret=quote_single(ast)
  return ret
##############################################################################
def sf_arith_op(ast,env):
  """Handles math operators"""
  assert_arity(std.count(ast)>=2, ast)
  ret= mk_node(ast)
  e1=str(std.first(ast))
  cmd=e1
  if e1=="unsigned-bit-shift-right":
    cmd=">>>"
  elif e1=="bit-shift-right":
    cmd=">>"
  elif e1=="bit-shift-left":
    cmd="<<"
  elif e1=="bit-and":
    cmd="&"
  elif e1=="bit-or":
    cmd="|"
  elif e1=="bit-not":
    cmd="~"
  elif e1=="bit-xor":
    cmd="^"
  elif e1=="mod":
    cmd="%"
  elif e1=="div":
    cmd="/"
  elif e1=="and":
    cmd="&&"
  elif e1=="or":
    cmd="||"
  elif e1=="exp":
    cmd="**"
  ###
  if "rem"== cmd:
    ret.add([REM_DIV,"(", tx_ex(std.second(ast),env), ",", tx_ex(std.third(ast),env), ")"])
  elif "~"== cmd:
    ret.add(["~",tx_ex(std.second(ast), env)])
  else:
    #handle negative number e.g. (- -2)= -1*-2
    if "-"== cmd and std.count(ast)==2:
      ret.add("-1 * ")
    for i,x in enumerate(ast.value):
      if i>0:
        if std.count(ast)>2:
          if i>1:
            ret.add(" "+str(cmd)+ " ")
        ret.add(tx_ex(x, env))
    ret=wrap(ret, "(", ")")
  return ret
##############################################################################
for x in ["bit-shift-left","bit-shift-right",
          "unsigned-bit-shift-right",
          "or","and","exp","rem",
          "+","-", "*", "/", "div", "mod",
          "bit-and", "bit-or", "bit-not", "bit-xor"]:
  SPEC_OPS[x]=sf_arith_op
##############################################################################
def sf_juxt(ast,env):
  """Takes a set of functions and returns a fn that is the juxtaposition
  of those fns.  The returned fn takes a variable number of args, and
  returns a vector containing the result of applying each fn to the
  args (left-to-right).
  ((juxt a b c) x) => [(a x) (b x) (c x)]"""
  ret= mk_node(ast)
  ARGS=str(std.gensym("A__"))
  KWARGS=str(std.gensym("K__"))
  out=[]
  for i,x in enumerate(ast.value[1:]):
    x=tx_ex(x,env)
    if len(out)>0:
      out.append(",")
    out.extend([x,"(*",ARGS,",*",KWARGS,")"])
  ret.add(["[",out,"]"])
  return wrap(ret,["lambda *", ARGS,",*",KWARGS,": "],"")
##############################################################################
SPEC_OPS["juxt"]=sf_juxt
##############################################################################
def sf_deref(ast,env):
  """Returns an atom's current state."""
  assert_arity(std.count(ast)==2,ast)
  return mk_node(ast).add([tx_ex(std.second(ast),env),".value"])
##############################################################################
SPEC_OPS["deref"]=sf_deref
##############################################################################
def sf_compose(ast,env):
  """Takes a set of functions and returns a fn that is the composition
  of those fns.  The returned fn takes a variable number of args,
  applies the rightmost of fns to the args, the next
  fn (right-to-left) to the result, etc."""
  assert_arity(std.count(ast)>=2,ast)
  end=std.count(ast)-2
  ret= mk_node(ast)
  tail=""
  KWARGS=str(std.gensym("K__"))
  ARGS=str(std.gensym("A__"))
  #go backwards -> right to left keep track of
  #prev result so that we can thread it to next function
  for i,x in enumerate(ast.value[1:]):
    ret.add([tx_ex(x,env),"("])
    tail += ")"
    if i==end:
      ret.add(f"*{ARGS},*{KWARGS}")
  return wrap(ret, f"lambda *{ARGS},*{KWARGS}: ",tail)
##############################################################################
SPEC_OPS["comp"]=sf_compose
##############################################################################
def sf_quote(ast,env):
  """Returns the unevaluated form"""
  assert_arity(std.count(ast)==2,ast)
  return wrap(mk_node(ast),"",quoteBANG(std.second(ast),env))
##############################################################################
SPEC_OPS["quote"]=sf_quote
##############################################################################
def sf_comp_op(ast,env):
  """Handle comparison operators"""
  assert_arity(std.count(ast)>=3,ast)
  cmd=str(std.first(ast))
  ret=mk_node(ast)
  if cmd== "not=":
    cmd="!="
  elif cmd=="=":
    cmd="=="
  i=1
  end= std.count(ast)-1
  while i<end:
    if i != 1:
      ret.add(" and ")
    ret.add([tx_ex(ast.value[i],env),
               " ",cmd," ", tx_ex(ast.value[i+1], env)])
    i += 1
  return wrap(ret,"(",")")
##############################################################################
for x in [">",">=","<","<=", "not=", "!=", "==", "="]:
  SPEC_OPS[x]=sf_comp_op
##############################################################################
def sf_deftype(ast,env):
  pass
##############################################################################
def sf_do(ast,env):
  pass
##############################################################################
def sf_case(ast,env):
  pass
##############################################################################
def sf_let(ast,env):
  pass
##############################################################################
def sf_var(ast,env):
  pass
##############################################################################
def sf_instQ(ast,env):
  """Evaluates x and tests if it is an instance of the class
  c. Returns true or false.
  (inst? c x)"""
  assert_arity(std.count(ast)==3,ast)
  return wrap(mk_node(ast),"", ["isinstance(", tx_ex(ast.value[2],env),",",tx_ex(ast.value[1],env),")"])
##############################################################################
SPEC_OPS["inst?"]=sf_instQ
##############################################################################
def sf_dissocBANG(ast,env):
  """Remove a key from Map."""
  assert_arity(std.count(ast)>2,ast)
  ret=mk_node(ast)
  for i,x in enumerate(ast.value[2:]):
    if i>0:
      ret.add(",")
    ret.add(tx_ex(x,env))
  return wrap(ret,[slibBANG(eng.KBSTDLR+"."+"dissocBANG"), "(", tx_ex(ast.value[1],env), ","], ")")
##############################################################################
SPEC_OPS["dissoc!"]=sf_dissocBANG
##############################################################################
def sf_new(ast,env):
  """The args, if any, are evaluated from left to right,
  and passed to the constructor of the class
  named by Classname. The constructed object is returned.
  e.g.
  (new Error 'a' 3)"""
  assert_arity(std.count(ast)>=2,ast)
  ret=mk_node(ast)
  for i,x in enumerate(ast.value[2:]):
    if i>0:
      ret.add(",")
    ret.add(tx_ex(x,env))
  return wrap(ret,[tx_ex(ast.value[1],env),"("],")")
##############################################################################
SPEC_OPS["new"]=sf_new
##############################################################################
def sf_throw(ast,env):
  """Throw an exception"""
  assert_arity(std.count(ast)==2,ast)
  stmtQ= is_stmt(ast)
  ret=mk_node(ast)
  exp=tx_ex(xfi(ast,std.second(ast)), env)
  if stmtQ:
    ret.add(["raise ", exp])
  else:
    ret.add(exp)
    ret=wrap(ret,"(lambda e: std.trap(e))(", ")")
  return ret
##############################################################################
SPEC_OPS["throw"]=sf_throw
##############################################################################
def sf_x_eq(ast,env):
  """Compound assignment operators"""
  assert_arity(std.count(ast)==3,ast)
  a0=str(std.first(ast))
  cmd=a0
  if a0== "unsigned-bit-shift-right=":
    cmd=">>>="
  elif a0=="bit-shift-right=":
    cmd=">>="
  elif a0=="bit-shift-left=":
    cmd= "<<="
  elif a0=="bit-xor=":
    cmd="^="
  elif a0=="bit-or=":
    cmd="|="
  elif a0=="bit-and=":
    cmd= "&="
  elif a0=="div=":
    cmd= "/="
  elif a0=="rem=":
    cmd="%="
  elif a0=="exp=":
    cmd="**="
  return wrap(mk_node(ast), "",[tx_ex(std.second(ast),env), " ",cmd," ",tx_ex(std.third(ast), env)])
##############################################################################
for x in ["+=","-=","*=","/=", "div=","rem=","exp=",
          "bit-and=", "bit-or=", "bit-xor=",
          "bit-shift-left=", "bit-shift-right=", "unsigned-bit-shift-right="]:
  SPEC_OPS[x]=sf_x_eq
##############################################################################
def sf_assocBANG(ast,env):
  """Object property assignment or array index setter."""
  assert_arity(std.is_even(std.count(ast)),ast)
  ret=mk_node(ast)
  obj=tx_ex(std.second(ast), env)
  end=std.count(ast)-3
  i=0
  args=ast.value[2:]
  while i<end:
    if i>0:
      ret.add(",")
    ret.add(tx_ex(xfi(ast,args[i]),env))
    ret.add(",")
    ret.add(tx_ex(xfi(ast,args[i+1]),env))
    i += 2
  return wrap(ret, [slibBANG(eng.KBSTDLR+".assocBANG("),obj,","],")")
##############################################################################
SPEC_OPS["assoc!"]=sf_assocBANG
##############################################################################
def sf_assignBANG(ast,env):
  """Object property assignment or array index setter."""
  assert_arity(std.is_even(std.count(ast)),ast)
  ret=mk_node(ast)
  obj=tx_ex(std.second(ast), env)
  i=0
  end=std.count(ast)-3
  while i<end:
    if i>0:
      ret.add(";")
    ret.add([obj, "[", tx_ex(xfi(ast,ast.value[i+2]),env),"]", "=", tx_ex(xfi(ast,ast.value[i+3]),env)])
    i += 2
  return ret
##############################################################################
for x in ["oset!","aset"]:
  SPEC_OPS[x]=sf_assignBANG
##############################################################################
def sf_set(ast,env):
  """Set value(s) to variable(s).
  e.g. (set! a 2 b 4 ...)"""
  assert_arity(not std.is_even(std.count(ast)),ast)
  ret=mk_node(ast)
  i=0
  end=std.count(ast)-2
  while i<end:
    if i>0:
      ret.add(";")
    ret.add([tx_ex(ast.value[i+1],env),
               "=", tx_ex(xfi(ast,ast.value[i+2]),env)])
    i += 2
  return ret
##############################################################################
for x in ["set!","var-set"]:
  SPEC_OPS[x]=sf_set
##############################################################################
def sf_fn(ast,env):
  pass
SPEC_OPS["fn"]=sf_fn
##############################################################################
def sf_func(ast,env):
  """Defines a function. Use defn- to indicate privacy (no export).
  (defn name doc-string? attr-map? [params*] ...)"""
  pass
for x in ["defn","defn-"]:
  SPEC_OPS[x]=sf_func
##############################################################################
def sf_try(ast,env):
  pass
SPEC_OPS["try"]=sf_try
##############################################################################
def sf_if(ast,env):
  """Evaluates test. If truthy evaluates 'then' otherwise 'else'.
  (if test then else)
  (if test then)"""
  assert_arity(std.count(ast)>=3,ast)
  stmtQ= False#is_stmt(ast)
  ret=mk_node(ast)
  #test is always an expression
  a1=expr_hint(xfi(ast,ast.value[1]),True)
  a2=expr_hint(xfi(ast,ast.value[2]),not stmtQ)
  mQ= std.count(ast)>3
  a3= None if not mQ else xfi(ast,ast.value[3])
  elze= None if not mQ else expr_hint(a3,not stmtQ)
  a1=tx_ex(a1, env)
  a2= tx_ex(a2, env)
  elze= tx_ex(elze, env)
  return wrap(ret,"", [a2, " if ", a1, " else ", elze or "None"] if not stmtQ else
              ["if ", a1, ":\n", a2, "\n", "else:\n", "None" if not mQ else [elze, "\n"]])
##############################################################################
SPEC_OPS["if"]=sf_if
##############################################################################
def sf_get(ast,env):
  """Returns the named property of an object,
  or value at the index of an array.
  (get obj \"age\")
  (aget obj 4)
  (nth obj 3)"""
  assert_arity(std.count(ast)==3,ast)
  ret=mk_node(ast)
  a0=str(std.first(ast))
  cmd=slibBANG(GET_PROP)
  if a0 != "get":
    ret=wrap(ret,"", [tx_ex(xfi(ast,ast.value[1]),env), "[", tx_ex(xfi(ast,ast.value[2]),env), "]"])
  else:
    ret=wrap(ret,"", [cmd, "(", tx_ex(xfi(ast,ast.value[1]),env), ",", tx_ex(xfi(ast,ast.value[2]),env),")"])
  return ret
##############################################################################
for x in ["oget","nth","get","aget"]:
  SPEC_OPS[x]=sf_get
##############################################################################
def sf_array(ast,env):
  """Creates a new vector containing the args.
  (vec \"hello\" \"world\")
  (vec 1 2 3)
  [1 2 3]
  [\"hello\" \"world\"]"""
  assert_arity(True,ast)
  ret=mk_node(ast)
  for i,x in enumerate(ast.value[1:]):
    if i>0:
      ret.add(",")
    ret.add(tx_ex(xfi(ast,ast.value[i+1]), env))
  return wrap(ret,"[","]")
##############################################################################
for x in ["vec","array"]:
  SPEC_OPS[x]=sf_array
##############################################################################
def sf_map_obj(ast,env):
  """?"""
  ret=mk_node(ast)
  assert_arity(True,ast)
  i=0
  end=std.count(ast)-2
  while i<end:
    if i>0:
      ret.add(",")
    ret.add([tx_ex(ast.value[i+1],env),":", tx_ex(ast.value[i+2],env)])
    i += 2
  return wrap(ret,"{","}")
##############################################################################
SPEC_OPS["hash-map"]=sf_map_obj
##############################################################################
def sf_set_obj(ast,env):
  """Returns a new Set.
  (set 1 2 3)"""
  assert_arity(True,ast)
  ret=mk_node(ast)
  i=0
  end=std.count(ast)-2
  while i<end:
    if i>0:
      ret.add(",")
    ret.add(tx_ex(ast.value[i+1],env))
    i += 1
  return wrap(ret,"{","}")
##############################################################################
SPEC_OPS["hash-set"]=sf_set_obj
##############################################################################
def requireBANG(path):
  pass
def sf_require2(ret,fdir,ast,env):
  pass
def sf_require(ast,env):
  pass
def sf_ns(ast,env):
  pass
##############################################################################
def sf_comment(ast,env):
  return ""
##############################################################################
SPEC_OPS["comment"]=sf_comment
##############################################################################
def sf_while(ast,env):
  """Generates native for loop."""
  assert_arity(std.count(ast)>=2,ast)
  stmtQ= is_stmt(ast)
  ret=mk_node(ast)
  body=expr_hint(xfi(ast,ast.value[2:]),False)
  #(if (empty? body) ret (sf-wloop ret (_2 ast) body env stmtQ)))
##############################################################################
SPEC_OPS["while"]=sf_while
##############################################################################
def sf_wloop(ret,tst,body,env,stmtQ):
  """For loop implementation"""
  (with-local-vars [nb '(not ____break)])
  (.add ret "for (let ____break=false; ")
  (xfi ret nb)
  (set! tst ['and nb tst])
  (xfi ret tst)
  (.add ret [(tx* tst env) ";"
             "){\n" (txDo body env #f) "}\n"])
  (if-not stmtQ
    (wrap ret "(function() {\n"  "; return null; }).call(this)")) ret)
##############################################################################





##############################################################################
if __name__ == "__main__":
  transpile(std.slurp("/tmp/x.ky"),"x.ky")
##############################################################################
#EOF


