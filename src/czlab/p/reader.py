from functools import reduce
import sys
import re
import stdlib as std
##############################################################################
class SNode:
  def __init__(self,aLine, aColumn, aSource, aChunks, aName):
    self.children = []
    self.sourceContents = {}
    self.line = None if aLine == None else aLine
    self.column = None if aColumn == None else aColumn
    self.source = None if aSource == None else aSource
    self.name = None if aName == None else aName
    if aChunks:
      self.add(aChunks)
  def add(self,aChunk):
    if type(aChunk)==list:
      for _,x in enumerate(aChunk):
        self.add(x)
    elif type(aChunk)==str or isinstance(aChunk,SNode):
      if aChunk:
        self.children.append(aChunk)
    else:
      raise Exception("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + str(aChunk))
    return self
  def prepend(self,aChunk):
    if type(aChunk)==list:
      for x in reversed(aChunk):
        self.prepend(x)
    elif type(aChunk)==str or isinstance(aChunk,SNode):
      self.children.insert(0,aChunk)
    else:
      raise Exception("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + str(aChunk))
    return self
  def walk(self,aFn):
    for x in self.children:
      if isinstance(x,SNode):
        x.walk(aFn)
      elif x:
        aFn(x, dict(source= self.source, line= self.line, column= self.column, name= self.name))
  def __str__(self):
    s= ""
    def f(x,arg=None):
      nonlocal s
      s += x
    self.walk(f)
    return s
##############################################################################
RX_ID= re.compile(r"^[a-zA-Z_$][\/.?\-*!0-9a-zA-Z_'<>%#@$\+]*$")
RX_ID2= re.compile(r"^[*\-][\/.?\-*!0-9a-zA-Z_'<>%#@$\+]+$")
RX_FLOAT= re.compile(r"^[-+]?[0-9]+\.[0-9]+$")
RX_INT= re.compile(r"^[-+]?[0-9]+$")
RX_HEX= re.compile(r"^[-+]?0x")
RX_WSPACE= re.compile(r"\s")
RX_FUNC=re.compile(r"^lambda\b")
##############################################################################
REPLACERS= [("?","_QMRK_"),
            ("!","_BANG_"),
            ("-","_DASH_"),
            ("'","_QUOT_"),
            ("#","_HASH_"),
            ("+","_PLUS_"),
            ("%","_PERC_"),
            ("@", "_AT_"),
            ("<","_LT_"),
            (">", "_GT_"),
            ("*", "_STAR_")]

##############################################################################
def dump_info(tag,ast):
  s= f"<{tag}>"
  if ast and type(ast.line)==int:
    s= f"<{tag} line=\"{ast.line}\" column=\"{ast.column}\">"
  return s
##############################################################################
def dump_ex(tree):
  s=""
  if std.is_primitive(tree):
    tree= tree.value
  if std.is_vector(tree):
    s=dump_info("vector",tree) + "".join(map(lambda x: dump_ex(x), tree)) + "</vector>"
  elif std.is_set(tree):
    s=dump_info("set",tree)+ "".join(map(lambda x: dump_ex(x), tree)) + "</set>"
  elif std.is_map(tree):
    s=dump_info("map",tree)+ "".join(map(lambda x: dump_ex(x), tree)) + "</map>"
  elif std.is_list(tree):
    s=dump_info("list",tree) + "".join(map(lambda x: dump_ex(x), tree))+ "</list>"
  elif std.is_pylist(tree):
    s=dump_info("sexpr",tree)+ "".join(map(lambda x: dump_ex(x),tree)) + "</sexpr>"
  elif std.is_lambda_arg(tree):
    s=dump_info("lambda-arg", tree) + tree.value  + "</lambda-arg>"
  elif std.is_keyword(tree):
    s=dump_info("keyword",tree)+ escXml(tree.value) + "</keyword>"
  elif std.is_symbol(tree):
    s=dump_info("symbol",tree)+ escXml(tree.value) + "</symbol>"
  elif std.is_regex_obj(tree):
    s=dump_info("regex",tree) + escXml(tree.value)+ "</regex>"
  elif std.is_string(tree):
    s="<string>"+ escXml(quote-str(tree))+ "</string>"
  elif std.is_number(tree):
    s="<number>"+ tree+ "</number>"
  elif tree==None:
    s="<reserved>"+"null"+"</reserved>"
  elif tree==True:
    s="<boolean>true</boolean>"
  elif tree==False:
    s="<boolean>false</boolean>"
  elif tree==None:
    s="<reserved>undefined</reserved>"
  else:
    throw_e(tree, "Bad AST")
  return s
##############################################################################
def dump_tree(tree,fname):
  return "<AbstractSyntaxTree file=\""+ std.esc_xml(fname)+ "\">" + dump_ex(tree) + "</AbstractSyntaxTree>"
##############################################################################
def peek_token(w):
  return w.tokens[w.pos]
##############################################################################
def prev_token(w):
  return w.tokens[w.pos-1]
##############################################################################
def pop_token(w):
  t=peek_token(w)
  w.pos += 1
  return t
##############################################################################
def testid(name):
  return RX_ID.search(name) or RX_ID2.search(name)
##############################################################################
def jsid(input):
  acc=""
  pfx=""
  name= str(input)
  if name and name.startswith("-"):
    pfx="-"
    name= name[1:]
  if testid(name):
    acc=f"{pfx}{name}".replace("/",".")
    for x,y in REPLACERS:
      acc=acc.replace(x,y)
      if acc.endswith(y):
        acc=acc[0:-1]
  else:
    if not pfx:
      acc=name
    else:
      acc= pfx+name
  return acc
##############################################################################
class Token:
  def __init__(self,source,line,column,value):
    self.source= source
    self.value= value
    self.line= line
    self.column= column
  def __repr__(self):
    return self.__str__()
  def __str__(self):
    return str(self.value)
##############################################################################
class NodeWrapper:
  def __init__(self,node):
    self.node=node
    self.source=""
    self.line=0
    self.column=0
##############################################################################
def mk_token(source,line,col,chunk):
  return Token(source,line,col,chunk)
##############################################################################
def throw_e(token,*msgs):
  s= "".join(msgs)
  if token:
    raise Exception(f"{s}\nnear line: {token.line}\nin file: {token.source}")
    raise Exception(f"{s}\nnear EOF")
##############################################################################
def copy_token_data(token,node):
  #TODO check object?
  if isinstance(node,std.CSExpr) or isinstance(node,std.CVec) or isinstance(node,std.CMap) or isinstance(node,std.CSet):
    node.source=token.source
    node.line= token.line
    node.column= token.column
  return node
##############################################################################
def read_atom(tseq):
  token=pop_token(tseq)
  ret=None
  tn= token.value
  if not tn:
    ret=None
  elif RX_FLOAT.search(tn):
    ret=std.to_float(tn)
  elif RX_HEX.search(tn) or RX_INT.search(tn):
    ret= std.to_int(tn)
  elif tn.startswith("\"") and tn.endswith("\""):
    ret= std.unquote_str(tn)
  elif tn.startswith(":"):
    ret= std.to_keyword(tn)
  elif tn.startswith("%"):
    ret= std.to_lambda_arg(tn)
  elif tn.startswith("#/") and (tn.endswith("/") or tn[0:-1].endswith("/")):
    ret= std.to_regex_obj(tn)
  elif tn== "nil" or tn== "None":
    ret=std.to_primitive(None)
  elif tn== "#t" or tn== "true":
    ret=std.to_primitive(True)
  elif tn== "#f" or tn== "false":
    ret=std.to_primitive(False)
  else:
    ret= std.to_symbol(tn)
  return copy_token_data(token,ret)
##############################################################################
def read_block(tseq,head,tail):
  token= pop_token(tseq)
  ast= []
  cur= None
  ok= True
  start= token
  if token.value != head:
    throw_e(token, f"expected '{head}'")
  while True:
    cur= peek_token(tseq)
    if not cur:
      throw_e(start, f"expected '{tail}', got EOF")
    elif tail== cur.value:
      break
    else:
      add_ast(ast, read_ex(tseq))
  #skip the tail token
  pop_token(tseq)
  return start,ast
##############################################################################
def read_list(tseq):
  start,block=read_block(tseq, "(",")")
  ret=std.CSExpr(block)
  return copy_token_data(start,ret)
##############################################################################
def read_vector(tseq):
  start,block=read_block(tseq, "[","]")
  ret=std.CVec(block)
  return copy_token_data(start,ret)
##############################################################################
def read_object_map(tseq):
  start,m=read_block(tseq, "{","}")
  if len(m) % 2 != 0:
    raise Exception("Bad map")
  #it=iter(m)
  #ret= std.CMap(dict(zip(it, it)))
  ret= std.CMap(m)
  return copy_token_data(start,ret)
##############################################################################
def read_object(tseq):
  return read_object_map(tseq)
##############################################################################
def read_object_set(tseq):
  start,block=read_block(tseq, "#{","}")
  ret=std.CSet(block)
  return copy_token_data(start,ret)
##############################################################################
def skip_parse(tseq,func):
  t= pop_token(tseq)
  ret= func(tseq)
  a1= ret.value[0]
  a1=copy_token_data(t, a1)
  return copy_token_data(t, ret)
##############################################################################
def __dollar(p1):
  x = std.to_symbol("str")
  y = read_ex(p1)
  if len(y)>1:
    y= [x,y]
  else:
    y.insert(0,x)
  return y
##############################################################################
SPEC_TOKENS= {"'": lambda p1: std.CSExpr([std.to_symbol("quote"), read_ex(p1)]),
              "`": lambda p1: std.CSExpr([std.to_symbol("syntax-quote"), read_ex(p1)]),
              "~": lambda p1: std.CSExpr([std.to_symbol("unquote"), read_ex(p1)]),
              "~@": lambda p1: std.CSExpr([std.to_symbol("splice-unquote"), read_ex(p1)]),
              "^": lambda p1: std.CSExpr([std.to_symbol("with-meta"), read_ex(p1), read_ex(p1)]),
              "@": lambda p1: std.CSExpr([std.to_symbol("deref"), read_ex(p1)]),
              "#": lambda p1: std.CSExpr([std.to_symbol("lambda"), read_ex(p1)]),
              "$": lambda p1: std.CSExpr([__dollar(p1)]),
              "[": [lambda p1: read_vector(p1)],
              "(": [lambda p1: read_list(p1)],
              "#{": [lambda p1: read_object_set(p1)],
              "`{": [lambda p1: read_object(p1)],
              "{": [lambda p1: read_object_map(p1)]
              }
##############################################################################
def read_ex(ts):
  token= peek_token(ts)
  ret=None
  tval=""
  if token:
    tval= token.value
  func= SPEC_TOKENS.get(tval)
  if isinstance(func,list):
    ret=func[0](ts)
  elif std.is_function(func):
    ret=skip_parse(ts,func)
  elif not token:
    pass
  elif tval== ";" or tval== ",":
    pop_token(ts)
  else:
    ret=read_atom(ts)
  return ret
##############################################################################
def add_ast(ast,f):
  if f:
    ast.append(f)
  return ast
##############################################################################
class TokensWrapper:
  def __init__(self,ts):
    self.tokens=ts
    self.pos=0
##############################################################################
def lexer(source,fname):
  slen=len(source)
  commentQ=False
  fformQ=False
  escQ=False
  strQ=False
  regexQ=False
  token=""
  jsEsc=0
  line=1
  ch=None
  nx=None
  col=0
  pos=0
  tree=[]
  tcol=col
  tline=line
  def toke(ln,col,s,sQ=False):
    if sQ or (s and len(s)>0):
      if s.startswith("&") and s != "&&" and len(s)>1:
        #split a &more token into 2 tokens & and more
        tree.append(mk_token(fname,ln,col,"&"))
        s=s[1:]
      elif s == "?":
        s= "undefined"
      elif s.startswith("@@"):
        s= "self." + s[2:]
      tree.append(mk_token(fname,ln,col,s))
    return ""
  #scan through the entire source string
  while pos< slen:
    #read the current char and peek the next char, moving the reader pointer to next
    ch= source[pos]
    col+=1
    pos+=1
    if pos < slen:
      nx= source[pos]
    #1. handle a newline, newline always turns off a comment
    if ch== "\n":
      col=0
      line+=1
      if commentQ:
        commentQ=False
    #big switch, order is IMPORTANT
    if commentQ:
      pass
    elif escQ:
      escQ=False
      token += ch
    elif regexQ:
      if ch== "\\":
        escQ=True
      token += ch
      if ch== "/":
        regexQ=False
        if not ("gimuy".find(nx)<0):
          token += nx
          pos+=1
        token= toke(tline,tcol,token)
    elif fformQ:
      if ch == "`" and nx == "`" and source[pos+1] == "`":
        fformQ=False
        pos += 2
        token += "\""
        token=toke(tline,tcol,token,True)
      else:
        if ch == "\"":
          token += "\\\""
        elif ch == "\n":
          token += "\\n"
        elif ch == "\\":
          if nx == "n" or nx == "r" or nx == "u" or nx == "t" or nx == "f" or nx == "v":
            token += ch
          else:
            token += "\\\\"
        else:
          token += ch
    elif ch == "`" and nx == "`" and source[pos+1] == "`" and len(token)==0:
      tline= line
      tcol= col
      pos += 2
      fformQ=True
      token += "\""
    elif ch == "\"":
      if not strQ:
        tline= line
        tcol= col
        strQ=True
        token += ch
      else:
        strQ=False
        token += ch
        token= toke(tline,tcol,token,True)
    #must be after the check for string
    elif strQ:
      if ch== "\n":
        ch= "\\n"
      if ch== "\\":
        escQ=True
      token += ch
    elif ch== "@" and nx== "@" and len(token)==0:
      tline= line
      tcol=col
      token += "@@"
      pos += 1
    elif ch== "`" and  nx== "{":
      token= toke(tline,tcol,token)
      tline=line
      tcol=col
      pos+=1
      toke(tline,tcol,"`{")
    elif ch== "'" or ch== "`" or ch== "$" or ch== "@" or ch == "^":
      if len(token)==0 and not RX_WSPACE.search(nx):
        tline= line
        tcol= col
        toke(tline,tcol,ch)
      else:
        token += ch
    elif ch== "&" and nx== "&":
      if len(token)==0:
        tline= line
        tcol=col
      token += "&&"
      pos+=1
    elif ch== "~":
      if len(token)==0 and not RX_WSPACE.search(nx):
        tline =line
        tcol= col
        if nx== "@":
          pos+=1
          toke(tline,tcol,"~@")
        else:
          toke(tline,tcol,ch)
      else:
        token += ch
    elif ch== "#" and nx== "/" and len(token)==0:
      regexQ=True
      tline= line
      tcol= col
      pos +=1
      token += "#/"
    elif ch== "#" and nx== "{":
      token=toke(tline,tcol,token)
      tline=line
      tcol=col
      pos+=1
      toke(tline,tcol,"#{")
    elif ch== "[" or ch== "]" or ch== "{" or ch== "}" or ch== "(" or ch== ")":
      token=toke(tline,tcol,token)
      tline= line
      tcol= col
      toke(tline,tcol,ch)
    elif ch== ";":
      token= toke(tline,tcol,token)
      tline=line
      tcol=col
      commentQ=True
    elif ch== "," or RX_WSPACE.search(ch):
      token=toke( (tline-1) if ch== "\n" else tline, tcol, token)
    else:
      if len(token)==0:
        tline= line
        tcol= col
      token += ch
  #endwhile
  #check for errors
  tmp= dict(source= fname, line= tline, column= col)
  if fformQ:
    throw_e(tmp, "unterminated free-form")
  if escQ:
    throw_e(tmp,"incomplete escape")
  if strQ:
    throw_e(tmp, "unterminated string")
  if regexQ:
    throw_e(tmp,"unterminated regex definition")
  return tree
##############################################################################
def parse(source,fname="*adhoc*"):
  tokens = lexer(source, fname)
  tlen = len(tokens)
  ast=[]
  w=TokensWrapper(tokens)
  while w.pos < tlen:
    add_ast(ast, read_ex(w))
  return ast

##############################################################################
#EOF

