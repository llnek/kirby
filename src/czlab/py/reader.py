# -*- coding: utf-8
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Copyright © 2013-2021, Kenneth Leung. All rights reserved. */
##############################################################################
import re,types
import core, kernel as std
##############################################################################
class Token:
  def __init__(self,source, line, column, value):
    self.source,self.line,self.column,self.value = source,line,column,value
  def __str__(self): return self.value
  def __repr__(self): return self.__str__()
##############################################################################
#Defining a lambda positional argument
class LambdaArg(std.SValue):
  def __init__(self,token):
    name= "1" if token.value == "%" else token.value[1:]
    v = int(name)
    if not (v >0):
      std.throwE(f"invalid lambda-arg {token.value}")
    super().__init__(f"%{v}")
##############################################################################
def mkToken(src, ln, col, txt):
  return Token(src, ln, col, txt)
##############################################################################
REGEX = types.SimpleNamespace(id= re.compile(r"^[a-zA-Z_$][\/.?\-*!0-9a-zA-Z_'<>%#@$\+]*$"),
           id2= re.compile(r"^[*\-][\/.?\-*!0-9a-zA-Z_'<>%#@$\+]+$"),
           float= re.compile(r"^[-+]?[0-9]+\.[0-9]+$"),
           int= re.compile(r"^[-+]?[0-9]+$"),
           hex= re.compile(r"^[-+]?0x"),
           dquoteHat= re.compile(r"^\""),
           dquoteEnd= re.compile(r"\"$"),
           func= re.compile(r"^lambda\*\b"),
           slash= re.compile(r"\/"),
           query= re.compile(r"\?"),
           perc= re.compile(r"%"),
           bang= re.compile(r"!"),
           plus= re.compile(r"\+"),
           dash= re.compile(r"-"),
           quote= re.compile(r"'"),
           hashn= re.compile(r"#"),
           at= re.compile(r"@"),
           dollar= re.compile(r"\$"),
           less= re.compile(r"<"),
           greater= re.compile(r">"),
           star= re.compile(r"\*"),
           wspace= re.compile(r"\s"))
##############################################################################
REPLACERS=[(REGEX.dollar, "_DOLA_"),
           (REGEX.query, "_QMRK_"),
           (REGEX.bang, "_BANG_"),
           (REGEX.dash, "_DASH_"),
           (REGEX.quote, "_QUOT_"),
           (REGEX.hashn, "_HASH_"),
           (REGEX.plus, "_PLUS_"),
           (REGEX.perc, "_PERC_"),
           (REGEX.at, "_AT_"),
           (REGEX.less, "_LT_"),
           (REGEX.greater, "_GT_"),
           (REGEX.star, "_STAR_")]
##############################################################################
def testid(name):
  return REGEX.id.search(name) or REGEX.id2.search(name)
##############################################################################
#Escape to compliant js identifier
def jsid(inp):
  pfx=""
  name= str(inp)
  if name and name.startswith("-"):
    pfx="-"
    name= name[1:]
  if testid(name):
    acc=f"{pfx}{name}".replace("/",".")
    for x,y in REPLACERS:
      acc=acc.replace(x,y)
      if acc.endswith(y): acc=acc[0:-1]
  else:
    if not pfx:
      acc=name
    else:
      acc= pfx+name
  return acc
##############################################################################
#Lexical analyzer
def lexer(source, fname):
  commentQ, fformQ, escQ, strQ, regexQ= False,False,False,False,False
  slen = len(source) if source else 0
  token,line,col,pos = "",1,0,0
  tree,tcol,tline = [],col,line
  ch,nx = None,None
  ###
  def _getc(n): return source[n] if n < slen else None
  def consec2(t): return ch == t and nx == t
  def multi(l,c,*ts): return [toke(l,c,t,True) for t in ts]
  def consec3(t): return ch == t and nx == t and _getc(pos+1) == t
  def toke(ln, co, s, sQ=False):
    if sQ or s:
      if s.startswith("&") and s != "&&" and len(s)>1:
        #turn &xs into 2 tokens [& and xs]
        tree.append(mkToken(fname, ln, co, "&"))
        s=s[1:]
      elif s.startswith("@@"):
        #short-hand for this.xxx
        s=f"this.{s[2:]}"
      tree.append(mkToken(fname, ln, co, s))
    return ""
  ####here we go
  while pos<slen:
    ch=_getc(pos)
    col+=1
    pos+=1
    nx= _getc(pos)
    if ch == "\n":
      col=0
      line+=1
      if commentQ:
        commentQ=False
    if commentQ:
      pass
      #wait till EOL
    elif escQ:
      escQ=False
      token += ch
    elif regexQ:
      if ch == "\\":
        escQ= True
      token += ch
      if ch == "/":
        regexQ= False
        if nx in "gimuy":
          token += nx
          pos+=1
        token = toke(tline, tcol, token)
    elif fformQ:
      if consec3("`") or consec3('"'):
        fformQ= False
        pos += 2
        token += "\""
        if ch=="`":
          multi(tline,tcol,"(", "raw#", token,")")
        else:
          toke(tline, tcol, token, true)
        token=""
      elif ch == "\"":
        token += "\\\""
      elif ch == "\n":
        token += "\\n"
      elif ch == "\\":
        token += ch if (nx == "n" or nx == "r" or nx == "u" or nx == "t" or nx == "f" or nx == "v") else "\\\\"
      else:
        token += ch
    elif not token and (consec3("`") or consec3('"')):
      tline = line
      tcol = col
      pos += 2
      fformQ= True
      token += "\""
    elif not token and not strQ and ch == "\"":
      tline = line
      tcol = col
      strQ= True
      token += ch
    elif strQ and ch=="\"":
      strQ= False
      token += ch
      token = toke(tline, tcol, token, True)
    elif strQ:
      if ch == "\n": ch = "\\n"
      if ch == "\\": escQ= True
      token += ch
    elif not token and consec2("@"):
      tline = line
      tcol = col
      token += "@@"
      pos+=1
    elif ch == "'" or ch == "`" or ch == "$" or ch == "@" or ch == "^":
      if not token and not REGEX.wspace.search(nx):
        tline = line
        tcol = col
        toke(tline, tcol, ch)
      else:
        token += ch
    elif consec2("&"):
      if not token:
        tline = line
        tcol = col
      token += "&&"
      pos+=1
    elif ch == "~":
      if not token and not REGEX.wspace.search(nx):
        tline = line
        tcol = col
        if nx == "@":
          pos+=1
          toke(tline, tcol, "~@")
        else:
          toke(tline, tcol, ch)
      else:
        token += ch
    elif not token and ch == "#" and nx == "/":
      regexQ= True
      tline = line
      tcol = col
      pos+=1
      token += "#/"
    elif ch == "#" and nx == "{":
      token = toke(tline, tcol, token)
      tline = line
      tcol = col
      pos+=1
      toke(tline, tcol, "#{")
    elif ch == "[" or ch == "]" or ch == "{" or ch == "}" or ch == "(" or ch == ")":
      token = toke(tline, tcol, token)
      tline = line
      tcol = col
      toke(tline, tcol, ch)
    elif ch == ";":
      token = toke(tline, tcol, token)
      tline = line
      tcol = col
      commentQ= True
    elif ch == "," or REGEX.wspace.search(ch):
      token = toke(tline-1 if ch == "\n" else tline, tcol, token)
    else:
      if not token:
        tline = line
        tcol = col
      token += ch
  ###
  tmp=types.SimpleNamespace(source= fname, line= tline, column=col)
  if fformQ: throwE(tmp, "unterminated free-form")
  if escQ: throwE(tmp, "incomplete escape")
  if strQ: throwE(tmp, "unterminated string")
  if regexQ: throwE(tmp, "unterminated regex definition")

  #maybe deal with the very last token?
  if len(token)>0:
    toke(tline, tcol, token)

  return types.SimpleNamespace(tokens=tree,pos=0)
##############################################################################
#Raise an error
def throwE(token,*msgs):
  s = "".join(msgs)
  raise Exception(f"{s} near EOF" if not token else f"{s} near line: {token.line}")
##############################################################################
#Returns the next token, updates the token index
def popToken(tree):
  t = peekToken(tree)
  tree.pos += 1
  return t
##############################################################################
#Returns the next token, without moving the token index
def peekToken(tree):
  return tree.tokens[tree.pos]
##############################################################################
#Returns the previous token
def prevToken(tree):
  return tree.tokens[tree.pos-1]
##############################################################################
#Attach source level information to the node
def copyTokenData(token, node):
  if core.hasSCI(node):
    node.source = token.source
    node.column = token.column
    node.line = token.line
  return node
##############################################################################
#Process an atom
def readAtom(tree):
  token = popToken(tree)
  ret,tn = None,token.value
  ###
  if not tn:
    pass
    #//ret = undefined
  elif REGEX.float.search(tn):
    ret = float(tn)
  elif REGEX.hex.search(tn) or REGEX.int.search(tn):
    ret = int(tn)
  elif tn.startswith("\"") and tn.endswith("\""):
    ret = std.unquoteStr(tn)
  elif tn.startswith(":"):
    ret = std.keyword(tn)
  elif tn.startswith("%"):
    ret = LambdaArg(token)
  elif tn.startswith("#/") and (tn.endswith("/") or tn[0:-1].endswith("/")):
    ret = std.RegexObj(tn)
  elif tn == "nil" or tn == "null":
    ret = std.Null()
  elif tn == "#t" or tn == "true":
    ret = True
  elif tn == "#f" or tn == "false":
    ret = False
  else:
    ret = std.symbol(tn)
  return copyTokenData(token, ret)
##############################################################################
#Process a LISP form
def readBlock(tree, ends):
  ast,token= std.pair(), popToken(tree)
  cur,jso,expr,ok,start=None,None,None,True,token
  ###
  if ends[0]=="[": ast=std.vector()
  if ends[0]=="(": expr=True

  if token.value != ends[0]:
    throwE(token, "expected '", ends[0], "'")

  while True:
    cur = peekToken(tree)
    if not cur: throwE(start, "expected '", ends[1], "', got EOF")
    if ends[1] == cur.value: break
    addAst(ast, readAst(tree))
  ##get rid of the last token
  popToken(tree)
  if jso:
    ast.insert(0,std.symbol("object*"))
  elif expr:
    if ast and std.isSymbol(ast[0]):
      cmd=str(ast[0])
      if cmd== "hash-map": ast[0].value="hashmap*"
      elif cmd== "hash-set": ast[0].value="hashset*"
      elif cmd== "list": ast[0].value="list*"
      elif cmd== "vec" or cmd=="vector": ast[0].value="vector*"
      elif cmd=="js-obj" or cmd== "object": ast[0].value="object*"
  elif ends[0]=="#{":
    ast.insert(0,std.symbol("hashset*"))
  elif ends[0]=="{":
    ast.insert(0,std.symbol("hashmap*"))
  return copyTokenData(start, ast)
##############################################################################
#Advance the token index, then continue to parse
def _skipParse(tree, func):
  return copyTokenData(popToken(tree), func(tree))
##############################################################################
def _metaFunc(a1):
  t= readAst(a1)
  return std.pair(std.symbol("with-meta"), readAst(a1), t)
##############################################################################
def _rspec(s):
  return lambda a: std.pair(std.symbol(s), readAst(a))
##############################################################################
def _group(x,y):
  return [lambda a: readBlock(a, (x,y))]
##############################################################################
LSPECS={
  "'": _rspec("quote"),
  "`": _rspec("syntax-quote"),
  "~": _rspec("unquote"),
  "~@": _rspec("splice-unquote"),
  "@": _rspec("deref"),
  "#": _rspec("lambda"),
  "^": _metaFunc,
  "{": _group("{","}"),
  "[": _group("[","]"),
  "(": _group("(",")"),
  "#{": _group("#{","}")
}
##############################################################################
#Inner parser routine
def readAst(tree):
  rc,tval,token= None,"",peekToken(tree)
  if token:
    tval=token.value
  func = LSPECS.get(tval)
  if type(func)==list:
    rc=func[0](tree)
  elif std.isFunction(func):
    rc=_skipParse(tree, func)
  elif tval == ";" or tval == ",":
    popToken(tree)
  elif not token:
    pass
  else:
    rc=readAtom(tree)
  return rc
##############################################################################
def addAst(ast, f): ast.append(f) if f else None
##############################################################################
#Main parser routine
def parse(source,*args):
  tree = lexer(source, (args and args[0]) or "*repl*")
  tlen = len(tree.tokens)
  ast = []
  #for t in tree.tokens: std.println("token=", str(t))
  while tree.pos < tlen: addAst(ast, readAst(tree))
  #std.println(std.prn(ast,1))
  return ast
##############################################################################
#EOF

