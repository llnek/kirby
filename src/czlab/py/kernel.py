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
import re,json,types
import core as std
##############################################################################
MODULE_NAMESPACE = "__module_namespace__"
##############################################################################
class RegexObj(std.SValue):
  def __init__(self,r): super().__init__(r)
##############################################################################
#reexport
SValue=std.SValue
DArray=std.DArray
Atom=std.Atom
Null=std.Null
SPair=std.SPair
JSObj=std.JSObj
Keyword=std.Keyword
SSymbol=std.SSymbol
##############################################################################
def println(*msgs): print("".join(msgs))
##############################################################################
def throwE(msg,line=None):
  raise Exception(f"{msg} near line: {line}" if type(line)==int else msg)
##############################################################################
def isFunction(x):
  s=str(type(x))
  return type(x)==types.FunctionType or s.find("function")>0 or s.find("method")>0
##############################################################################
def isSequential(o):
  return isVec(o) or isPair(o) or isinstance(o,list)
##############################################################################
def isPair(a,checkEmpty=False):
  return (len(a)>0 if checkEmpty else True) if isinstance(a,SPair) else False
##############################################################################
def isVec(a,checkEmpty=False):
  return (len(a)>0 if checkEmpty else True) if isinstance(a,DArray) else False
##############################################################################
def rtti(v): return f"{type(v)}"
##############################################################################
def isNichts(o): return isinstance(o,Null)
##############################################################################
def isEven(n): return n%2 == 0
##############################################################################
def isOdd(n): return n%2 != 0
##############################################################################
def isStr(o): return type(o) == str
##############################################################################
def isNum(o): return type(o) == int or type(o) == float
##############################################################################
def isBool(o): return o == True or o == False
##############################################################################
def isJSObj(x): return isinstance(x,JSObj)
##############################################################################
def isSimple(o):
  return isNichts(o) or isStr(o) or isNum(o) or isBool(o)
##############################################################################
def isKeyword(o,what=None):
  return (what==o.value if what else True) if isinstance(o,Keyword) else False
##############################################################################
def isSymbol(o,what=None):
  return (what== str(o) if what else True) if isinstance(o,SSymbol) else False
##############################################################################
def isMap(o): return isinstance(o,dict)
##############################################################################
def isNil(o): return isinstance(o,Null) or o is None
##############################################################################
def isObject(o): return isJSObj(o)
##############################################################################
def isSet(o): return isinstance(o, set)
##############################################################################
def isAtom(o): return isinstance(o,Atom)
##############################################################################
def isList(o): return isinstance(o,list)
##############################################################################
def copyVec(src):
  r=DArray()
  r.extend(src)
  return r
##############################################################################
def toVec(*xs):
  r=DArray()
  if xs: r.extend(xs)
  return r
##############################################################################
def toPair(*xs):
  r=SPair()
  if xs: r.extend(xs)
  return r
##############################################################################
def copyPair(src):
  r=SPair()
  r.extend(src)
  return r
##############################################################################
def pair(*xs): return toPair(*xs)
##############################################################################
#true if both are equal
def isEQ(a,b):
  ok=False
  if isMap(a) and isMap(b):
    if len(a)==len(b):
      ok=True
      for k,v in a.items():
        if k not in b or not isEQ(v, b.get(k)): ok=False
  elif isJSObj(a) and isJSObj(b):
    ok=isEQ(vars(a),vars(b))
  elif isSet(a) and isSet(b):
    if len(a)==len(b):
      ok=True
      for v in a:
        if v not in b: ok=False
  elif isList(a) and isList(b):
    if len(a)==len(b):
      ok=True
      for i,v in enumerate(a):
        if not isEQ(v,b[i]): ok=False
  elif isSymbol(a) and isSymbol(b):
    ok= a.value == b.value
  elif isKeyword(a) and isKeyword(b):
    ok= str(a) == str(b)
  elif isStr(a) and isStr(b):
    ok= a==b
  elif isNum(a) and isNum(b):
    ok= a==b
  elif isBool(a) and isBool(b):
    ok= a==b
  elif isNil(a) and isNil(b):
    ok=True
  return ok
##############################################################################
#Escape XML special chars
def escXml(s):
  out = ""
  if s:
    for i,c in enumerate(s):
      if c == "&":
        c = "&amp;"
      elif c == ">":
        c = "&gt;"
      elif c == "<":
        c = "&lt;"
      elif c == "\"":
        c = "&quot;"
      elif c == "'":
        c = "&apos;"
      out += c
  return out
##############################################################################
#conj[oin]. Returns coll with the xs 'added'.
#(conj! nil item) returns (item).
#If coll is a list, prepends else appends to coll.
def conjBANG(coll,*xs):
  if isPair(coll):
    for v in xs: coll.insert(0,v)
  elif isList(coll):
    for v in xs: coll.append(v)
  elif isMap(coll):
    for v in xs:
      if not isList(v) or len(v) != 2: throwE("bad arg: conj!")
      coll[str(v[0])]=v[1]
  elif isSet(coll):
    for v in xs: coll.add(v)
  else:
    throwE(f"Cannot conj! with: {type(coll)}")
  return coll
##############################################################################
#Add entry to map
def assocBANG(coll,*xs):
  if not isMap(coll):
    throwE(f"Cannot assoc! with: {type(coll)}")
  if len(xs)%2 != 0:
    throwE(f"assoc! expecting even n# of args")
  i,z=0,len(xs)
  while i<z:
    coll[str(xs[i])]= xs[i+1]
    i += 2
  return coll
##############################################################################
#Like conj! but returns a new collection
def conj(coll,*xs):
  r=None
  if isVec(coll):
    r=copyVec(coll)
  elif isPair(coll):
    r=copyPair(coll)
  elif type(coll)==list:
    r=coll[:]
  elif coll is None:
    r= toPair()
  elif isJSObj(coll):
    r=copy(coll)
  elif isMap(coll) or isSet(coll):
    r=coll.copy()
  else:
    throwE(f"Cannot conj with: {typeof(coll)}")
  return conjBANG(r,*xs) if r else None
##############################################################################
def mod(x,N): return x % N
##############################################################################
def optQQ(a,b): return b if a is None else a
##############################################################################
#Generates next random symbol
GENSYM_COUNTER = 0
def gensym(pfx=None):
  global GENSYM_COUNTER
  pfx= "GS__" if not pfx else pfx
  GENSYM_COUNTER += 1
  return SSymbol(f"{pfx}{GENSYM_COUNTER-1}")
##############################################################################
def symbol(v): return SSymbol(v)
##############################################################################
def keyword(v): return Keyword(v)
##############################################################################
#Add quotes around a string
def quoteStr(s):
  out = "\""
  if s:
    for i,ch in enumerate(s):
      if ch == "\"":
        out += "\\\""
      elif ch == "\n":
        out += "\\n"
      elif ch == "\t":
        out += "\\t"
      elif ch == "\f":
        out += "\\f"
      elif ch == "\r":
        out += "\\r"
      elif ch == "\v":
        out += "\\v"
      elif ch == "\\":
        out += ch if "u" == s[i+1] else "\\\\"
      else:
        out += ch
  out += "\""
  return out
##############################################################################
#Removes quotes around a string
def unquoteStr(s):
  if isStr(s) and s.startswith("\"") and s.endswith("\""):
    i,out,s= 0,"", s[1:-1]
    z=len(s)
    while i<z:
      ch=s[i]
      if ch== "\\":
        i+=1
        nx=s[i]
        if nx== "\"":
          out += "\""
        elif nx== "\\":
          out += "\\"
        elif nx== "n":
          out += "\n"
        elif nx== "t":
          out += "\t"
        elif nx== "f":
          out += "\f"
        elif nx== "v":
          out += "\v"
        elif nx== "r":
          out += "\r"
        else:
          i -=1
          out += ch
      else:
        out += ch
      i +=1
    s=out
  return s
##############################################################################
#If prop is a string, returns the value of this object property,
#if object is a Map, returns value of the key.
#Otherwise, return the value at the index of the array.
def getProp(obj, prop):
  rc=None
  if isMap(obj):
    rc=obj.get(prop)
  elif isSet(obj):
    if type(prop)==int:
      try:
        rc=list(obj)[prop]
      except:
        pass
  elif isList(obj):
    if type(prop)==int:
      try:
        rc=obj[prop]
      except:
        pass
  elif isObject(obj):
    rc=vars(obj).get(prop)
  return rc
##############################################################################
#Splits string on a sep or regular expression.  Optional argument limit is
#the maximum number of splits. Returns vector of the splits.
def split(s, r,limit=None):
  if type(s) != str:
    throwE(f"Cannot split with: {rtti(s)}")
  out=toPair()
  rc= re.split(r,s,limit) if type(limit)==int else re.split(r,s)
  for x in rc: out.append(x)
  return out
##############################################################################
#If coll is empty, returns nil, else coll.
def notEmpty(coll):
  n=0
  if coll is None or isNum(coll) or isBool(coll):
    throwE(f"Cannot notEmpty with: {rtti(coll)}")
  elif isObject(coll):
    n=len(vars(coll))
  else:
    n=len(coll)
  return coll if n>0 else None
##############################################################################
#Count the number of elements inside.
def count(coll):
  n=0
  if coll is None or isNum(coll) or isBool(coll):
    throwE(f"Cannot count with: {rtti(coll)}")
  elif isObject(coll):
    n=len(vars(coll))
  else:
    n=len(coll)
  return n
##############################################################################
#Adds one element to the beginning of a collection.
def consBANG(x, coll):
  if isinstance(coll,list):
    coll.insert(0,x)
  else:
    throwE(f"Cannot cons! with: {rtti(coll)}")
  return coll
##############################################################################
#Returns the last element
def last(coll):
  return coll[-1] if (type(coll)==str or isList(coll)) and len(coll)>0 else None
##############################################################################
#true if item is inside
def contains(coll, x):
  rc=None
  if isMap(coll) or isSet(coll) or isList(coll) or type(coll)==str:
    rc= x in coll
  else:
    throwE(f"Cannot contains? with: {rtti(coll)}")
  return rc
##############################################################################
#Merge maps
def mergeBANG(base, m):
  ret= base or dict()
  src= m or dict()
  if not (isMap(ret) or isObject(ret)): throwE("bad merge")
  if not (isMap(src) or isObject(src)): throwE("bad merge")
  def loop(v, k):
    ret[k]=v if isMap(ret) else setattr(ret,k,v)
  for i,z in (vars(src) if isObject(src) else src).items(): loop(z,i)
  return ret
##############################################################################
#Returns a map that consists of the rest of the maps conj-ed onto
#the first.  If a key occurs in more than one map, the mapping from
#the latter (left-to-right) will be the mapping in the result.
def merge(*xs):
  out=dict()
  for v in xs: mergeBANG(out,v)
  return out
##############################################################################
#Returns a new seq where x is the first element and seq is the rest.
def cons(x, coll):
  if not isSequential(coll):
    throwE(f"Cannot cons with: {rtti(coll)}")
  rc=copyPair(coll)
  rc.insert(0,x)
  return rc
##############################################################################
#Use a cache to store already referenced objects to prevent circular references.
def noCRef():
  cache=[]
  def fn(_,v):
    if isFunction(v):
      v= "native-fn"
    elif not isSimple(v):
      if v in cache:
        v=None
      else:
        cache.append(v)
    return v
  return fn
##############################################################################
#Print data as string - use to dump an AST node.
def prn(obj,rQ=None):
  #check for no cyclic reference
  f=noCRef()
  f(None,obj)
  return prnEx(obj, rQ, f)
##############################################################################
#@private
def prnArr(obj, rQ, f):
  return " ".join([ prnEx(f(i,v),rQ, f) for i,v in enumerate(obj)])
##############################################################################
#@private
def prnEx(obj, rQ, func):
  pfx = lambda a: prnEx(a, rQ, func)
  parr= lambda a,b: wrapStr(prnArr(obj, rQ, func), a,b)
  if isinstance(obj,Atom):
    c3 = wrapStr(pfx(obj.value), "(atom ", ")")
  elif isinstance(obj, SValue):
    c3=obj.value
  elif isMap(obj):
    acc=[]
    for k,v in obj.items():
      if not isNichts(v):
        x= func(k, v)
        v= "!!!!cyclic reference!!!!" if x is None else x
      acc.append(f"{pfx(k)} {pfx(v)}")
    c3 = wrapStr(" ".join(acc), "{", "}")
  elif isSet(obj):
    acc=[]
    for v in obj:
      if not isNichts(v):
        x= func("", v)
        v= "!!!!cyclic reference!!!!" if x is None else x
      acc.append(f"{pfx(v)}")
    c3 = wrapStr(" ".join(acc), "#{", "}")
  elif isPair(obj):
    c3 = parr("(", ")")
  elif isVec(obj):
    c3= parr("[", "]")
  elif isObject(obj):
    acc=[]
    for k,v in vars(obj).items():
      if not k.endswith("____sci"):
        if not isNichts(v):
          x= func(k, v)
          v= "!!!!cyclic reference!!!!" if x is None else x
        acc.append(f"{pfx(k)} {pfx(v)}")
    c3 = wrapStr(" ".join(acc), "(js-obj ", ")")
  elif isStr(obj):
    c3 = quoteStr(obj) if rQ else obj
  elif obj is None:
    c3="nil"
  elif obj=="undefined": #TODO
    c3="undefined"
  elif type(obj)==list:
    c3= parr("(", ")")
  elif obj is False:
    c3="false"
  elif obj is True:
    c3="true"
  else:
    c3= str(obj)
  return c3
##############################################################################
#Returns a sequence of successive items from coll while
#(pred item) returns logical true. pred must be free of side-effects.
def takeWhile(pred,coll):
  ret= []
  for v in coll:
    if not pred(v): break
    ret.append(c)
  return ret
##############################################################################
#Returns a sequence of the items in coll starting from the
#first item for which (pred item) returns logical false.
def dropWhile(pred,coll):
  ret=[]
  for i,v in enumerate(coll):
    if not pred(v):
      ret=coll[i:]
      break
  return ret
##############################################################################
#Returns a list of [(take-while pred coll) (drop-while pred coll)]
def splitWith(pred, coll):
  return toPair(takeWhile(pred, coll), dropWhile(pred, coll))
##############################################################################
#Split a collection into 2 parts
def splitSeq(coll,cnt):
  x,y=SPair(),SPair()
  if cnt<len(coll):
    i=0
    while i<cnt:
      x.append(coll[i])
      i+=1
    i=cnt
    while i<len(coll):
      y.append(coll[i])
      i+= 1
  else:
    x=into(x, coll)
    #y=SPair()
  return [x,y]
##############################################################################
#Returns a seq of the items in coll in reverse order.
#If rev is empty returns nil.
def rseq(obj):
  rc=SPair()
  if isStr(obj):
    for c in list(obj): rc.insert(0,c)
  elif isMap(obj):
    for k,v in obj.items(): rc.insert(0,toVec(k,v))
  elif isSet(obj):
    for v in obj: rc.insert(0,v)
  elif isList(obj):
    for a in obj: rc.insert(0,a)
  else:
    throwE(f"Cannot rseq with: {rtti(obj)}")
  return rc
##############################################################################
#Returns a sequence of lists of n items each.
def partition(n, coll):
  _x_,_r_,recur,_zz_=None,None,None,std.Atom("!")
  ###
  def _f_(ret, arg):
    if notEmpty(arg[0]): ret.append(arg[0])
    return ret if 0 == count(arg[1]) else recur(ret, splitSeq(arg[1], n))
  _r_ = _f_
  def _loop(*xs):
    nonlocal _x_, _r_,_zz_
    _x_=xs
    if not (_r_ is _zz_):
      _r_=_zz_
      while _r_ is _zz_: _r_= _f_(*_x_)
      return _r_
    return _zz_
  recur=_loop
  if isSequential(coll):
    return recur(toPair(), splitSeq(coll, n))
  elif not coll:
    return toPair()
  else:
    throwE(f"Cannot partition with: {rtti(coll)}")
##############################################################################
#Prepend and append strings to the object.
def wrapStr(obj, start, end):
  return "".join([start, obj, end])
##############################################################################
#Returns a sequence.
def seq(obj):
  rc=SPair()
  if isStr(obj):
    for v in list(obj): rc.append(v)
  elif isMap(obj):
    for k,v in obj.items(): rc.append(toVec(k,v))
  elif isSet(obj) or isSequential(obj):
    for v in obj: rc.append(v)
  else:
    throwE(f"Cannot seq with: {rtti(obj)}")
  return rc
##############################################################################
def vector(*xs): return toVec(*xs)
##############################################################################
def hashmap(*xs):
  if len(xs)%2 != 0:
    throwE("Arity Error: even n# expected.")
  i,out=0,dict()
  while i<len(xs):
    out[str(xs[i])]= xs[i+1]
    i+=2
  return out
##############################################################################
def atom(v): return Atom(v)
##############################################################################
def isFalsy(a):
  return (a is None) or (a == False)
##############################################################################
def hashset(*xs): return set(xs)
##############################################################################
#JSON stringify (no cyclical obj-ref)
def stringify(obj):
  return json.dumps(obj, separators=(",", ":")) if obj else None
##############################################################################
#Returns a new coll consisting of to-coll with all of the items of from-coll conjoined.
def into(to, coll):
  if isSequential(coll):
    for v in coll: to.append(v)
  else:
    throwE(f"Cannot into with: {rtti(to)} to {rtti(coll)}")
  return to
##############################################################################
def jsobj(*xs):
  if len(xs)%2 != 0:
    throwE("Invalid arity for: jsobj")
  i,rc=0,JSObj()
  while i<len(xs):
    setattr(rc,str(xs[i]),xs[i+1])
    i+=2
  return rc
##############################################################################
#Add many to this collection.
def concat(coll,*xs):
  rc=SPair()
  for v in seq(coll): rc.append(v)
  for v in xs:
    for w in seq(v): rc.append(w)
  return rc
##############################################################################
def repeatEvery(coll, start, step):
  rc=None
  if isSequential(coll):
    rc=toPair()
    i=start
    while i<len(coll):
      rc.append(coll[i])
      i+=step
  else:
    throwE(f"Cannot repeat-every with: {rtti(coll)}")
  return rc
##############################################################################
#Collect every 2nd item starting at 0.
def evens(coll): return repeatEvery(coll, 0, 2)
##############################################################################
#Collect every 2nd item starting at 1.
def odds(coll): return repeatEvery(coll, 1, 2)
##############################################################################
#EOF

