import types
import sys

STAR_NS_CACHE_STAR=[]



##############################################################################
def peek_nsp():
  return STAR_NS_CACHE_STAR[0] if len(STAR_NS_CACHE_STAR)>0 else None
##############################################################################
def is_nil(v):
  return v==None
##############################################################################
def is_bool(v):
  return v==True or v==False
##############################################################################
def is_number(v):
  return type(v)==int or type(v)==float
##############################################################################
def is_string(v):
  return type(v)==str
##############################################################################
def quote_str(s):
  out= "\""
  ch=""
  for i,x in enumerate(s):
    ch=s[i]
    if ch== "\"":
      out += "\\\""
    elif ch== "\n":
      out += "\\n"
    elif ch== "\t":
      out += "\\t"
    elif ch== "\f":
      out += "\\f"
    elif ch== "\r":
      out += "\\r"
    elif ch== "\v":
      out += "\\v"
    elif ch== "\\":
      out += ch if "u"== s[i+1] else "\\\\"
    else:
      out += ch
  out += "\""
  return out
##############################################################################
def unquote_str(s):
  ret=s
  if is_string(s) and s.startswith("\"") and s.endswith("\""):
    s=s[1:-1]
    i=0
    out=""
    slen=len(s)
    while i < slen:
      nx=None
      ch=s[i]
      if ch== "\\":
        i+=1
        nx=s[i]
        if nx== "\"":
          out += "\""
        elif nx== "\\":
          out+= "\\"
        elif nx== "n":
          out+= "\n"
        elif nx== "t":
          out+= "\t"
        elif nx== "f":
          out+= "\f"
        elif nx== "v":
          out+= "\v"
        elif nx== "r":
          out+= "\r"
        else:
          i -=1
          out +=ch
      else:
        out += ch
      i+=1
    ret=out
  return ret
##############################################################################
def slurp(path):
  data=""
  with open(path, "r") as file:
    data = file.read()
  return data
##############################################################################
class CBase:
  def __init__(self):
    self.source=""
    self.meta=None
    self.line=0
    self.column=0
    self.expr=False
  def isAtom(self):
    return not self.isPair()
  def isPair(self):
    return type(self.value)==list or type(self.value)==set or type(self.value)==dict
  def __repr__(self):
    return self.__str__()
  def __str__(self):
    return str(self.value)
##############################################################################
class CList(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class CSExpr(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class CVec(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class CMap(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class CSet(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class LambdaArg(CBase):
  def __init__(self,arg):
    CBase.__init__(self)
    name= "1" if arg== "%" else arg[1:]
    v= int(name)
    if not (v>0):
      raise Exception(f"invalid lambda-arg {arg}")
    self.value= f"%{v}"
##############################################################################
class Primitive(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class RegexObj(CBase):
  def __init__(self,v):
    CBase.__init__(self)
    self.value=v
##############################################################################
class Keyword(CBase):
  def __init__(self,name):
    CBase.__init__(self)
    self.value=name
  def __str__(self):
    s=None
    if self.value.startswith("::"):
      s=star_ns_star() + "/" + self.value[2:]
    elif self.value.startswith(":"):
      s=self.value[1:]
    return s
##############################################################################
class Symbol(CBase):
  def __init__(self,name):
    CBase.__init__(self)
    self.value=name
##############################################################################
class Atom(CBase):
  def __init__(self,val):
    CBase.__init__(self)
    self.value=val
##############################################################################
def esc_xml(s):
  out=""
  for c in s:
    if c== "&":
      c= "&amp;"
    if c== ">":
      c= "&gt;"
    if c== "<":
      c= "&lt;"
    if c== "\"":
      c= "&quot;"
    if c== "'":
      c= "&apos;"
    out += c
  return out
##############################################################################
def not_empty(v):
  rc=True
  if isinstance(v,CVec) or isinstance(v,CList) or isinstance(v,CSet) or isinstance(v,CMap):
    rc=len(v.value)>0
  elif isinstance(v,CSExpr):
    rc=len(v.value)>0
  elif type(v)==str:
    rc=len(v)>0
  return v if rc else False
##############################################################################
def is_sequential(v):
  return type(v)==str or isinstance(v,CVec) or isinstance(v,CList) or isinstance(v,CSExpr)
##############################################################################
def is_coll(v):
  return is_sequential(v) or isinstance(v,CMap) or isinstance(v,CSet)
##############################################################################
def count(v):
  n=0
  if type(v)==str:
    n=len(v)
  elif is_coll(v):
    n=len(v.value)
  return n
##############################################################################
def first(v):
  rc=None
  if count(v)>0:
    if isinstance(v,CMap):
      it=enumerate(v.value)
      x=it.next()
      rc=(x[1],y[x[1]])
    elif type(v)==str:
      rc=v[0]
    else:
      rc=v.value[0]
  return rc
##############################################################################
def second(v):
  rc=None
  if count(v)>1:
    if isinstance(v,CMap):
      it=enumerate(v.value)
      it.next()
      x=it.next()
      rc=(x[1],y[x[1]])
    elif type(v)==str:
      rc=v[1]
    else:
      rc=v.value[1]
  return rc
##############################################################################
def third(v):
  rc=None
  if count(v)>2:
    if isinstance(v,CMap):
      it=enumerate(v.value)
      it.next()
      it.next()
      x=it.next()
      rc=(x[1],y[x[1]])
    elif type(v)==str:
      rc=v[2]
    else:
      rc=v.value[2]
  return rc
##############################################################################
def is_function(x):
  s=str(type(x))
  return type(x)==types.FunctionType or s.find("function")>0 or s.find("method")>0
##############################################################################
def is_sexpr(v):
  return isinstance(v,CSExpr)
##############################################################################
def is_complex(v):
  return is_list(v) or is_map(v) or is_set(v) or is_vector(v) or is_sexpr(v)
##############################################################################
def is_list(v):
  return isinstance(v,CList)
##############################################################################
def is_map(v):
  return isinstance(v,CMap)
##############################################################################
def is_set(v):
  return isinstance(v,CSet)
##############################################################################
def is_vector(v):
  return isinstance(v,CVec)
##############################################################################
def is_pylist(v):
  return type(v)==list
##############################################################################
def into_vector(arg):
  return None
##############################################################################
def into_set(arg):
  return None
##############################################################################
def into_list(arg):
  return None
##############################################################################
def into(t,v):
  r=None
  if t=="vector":
    r=into_vector(v)
  elif t=="list":
    r=into_list(v)
  elif t=="set":
    r=into_set(v)
  if not r:
    raise Exception("bad arg for into()")
  return r
##############################################################################
def is_primitive(obj):
  return isinstance(obj,Primitive)
##############################################################################
def to_primitive(v):
  return Primitive(v)
##############################################################################
def is_regex_obj(obj):
  return isinstance(obj,RegexObj)
##############################################################################
def to_regex_obj(name):
  return RegexObj(name)
##############################################################################
def is_symbol(obj):
  return isinstance(obj,Symbol)
##############################################################################
def to_symbol(name):
  return Symbol(name)
##############################################################################
def is_keyword(obj):
  return isinstance(obj,Keyword)
##############################################################################
def to_keyword(name):
  return Keyword(name)
##############################################################################
def to_float(v):
  return float(v)
##############################################################################
def to_int(v):
  return int(v)
##############################################################################
def keyword_to_symbol(k):
  s= Symbol(str(k))
  s.source= k.source
  s.line=  k.line
  s.column= k.column
  return s
##############################################################################
def is_lambda_arg(obj):
  return isinstance(obj,LambdaArg)
##############################################################################
def to_lambda_arg(name):
  return LambdaArg(name)
##############################################################################
def is_atom(a):
  return isinstance(a,Atom)
##############################################################################
def to_atom(v):
  return Atom(v)
##############################################################################
GENSYM_COUNTER=0
##############################################################################
def gensym(pfx="GS__"):
  """
  Generates next random symbol
  """
  global GENSYM_COUNTER
  GENSYM_COUNTER += 1
  return to_symbol(f"{pfx}{GENSYM_COUNTER}")
##############################################################################
def rem(x,N):
  y=x//N
  return x - y*N
##############################################################################
def is_even(n):
  return n%2==0
##############################################################################
def trap(e):
  raise e
##############################################################################
def dissocBANG(obj, *xs):
  if obj:
    for x in xs:
      try:
        del obj[x]
      except:
        pass
  return obj
##############################################################################
def assocBANG(obj,*xs):
  if obj:
    i=0
    end=len(xs)-1
    while i<end:
      obj[xs[i]]=xs[i+1]
      i +=2
  return obj
##############################################################################
#EOF
