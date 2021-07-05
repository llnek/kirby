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
from functools import reduce
from cmd import Cmd
import copy,sys,types
import core
import kernel as std
import reader as rdr
##############################################################################
macro_assert = "\n (macro* assert* [c msg] `(if* ~c true (throw* ~msg))) "
GLOBAL = None
EXPKEY = "da57bc0172fb42438a11e6e8778f36fb"
KBSTDLR = "kirbyref"
KBPFX = "czlab.kirby."
KBSTDLIB = f"{KBPFX}stdlib"
prefix = "kirby> "
throwE=std.throwE
println= std.println
##############################################################################
_STAR_version_STAR = ""
inited= False
g_env = None
##############################################################################
def _expect(k):
  if not std.isSymbol(k): throwE("expected symbol")
##############################################################################
#Lexical Environment
class LEXEnv:
  #Create and initialize a new env with these symbols, optionally a parent env
  def __init__(self, parent=None, syms=None, vals=None):
    self.data = dict()
    self.par = None
    syms= syms or []
    vals= vals or []
    if parent:
      self.par = parent
    for i,e in enumerate(syms):
      ev= e.value
      if ev.startswith("&"):
        #deal with [&xs] arg
        self.data[f"{syms[i+1]}" if ev=="&" else  ev.slice(1)]= vals[i:]
        break
      self.data[ev]= vals[i]
  #Find the env containing this symbol
  def find(self,k):
    _expect(k)
    if k.value in self.data:
      return self
    if self.par:
      return self.par.find(k)
  #Bind this symbol, value to this env
  def set(self,k, v):
    _expect(k)
    self.data[k.value]=v
    return v
  #Get value of this symbol
  def get(self,k):
    _expect(k)
    env = self.find(k)
    if not env: throwE(f"Unknown var: {k}")
    return env.data[k.value]
  #Print set of vars
  def prn(self):
    return std.prn(self.data,True)
  def select(self,what):
    acc=dict()
    for k,v in self.data.items():
      c6=True
      if what=="fn":
        c6 = std.isFunction(v)
      if what=="var":
        c6 = not std.isFunction(v)
      if c6:
        acc[str(k)]=v
    return acc
##############################################################################
_STAR_vars_STAR = dict()
_STAR_libs_STAR = dict()
##############################################################################
def getLib(alias): return _STAR_libs_STAR[alias]
##############################################################################
def getLibKeys(): return _STAR_libs_STAR.keys()
##############################################################################
def addVar(sym, info):
  s = str(sym)
  m = _STAR_vars_STAR.get(s)
  if m:
    throwE(f"var: {s} already added")
  _STAR_vars_STAR[s]=info
##############################################################################
def getVar(sym): return _STAR_vars_STAR.get(str(sym))
##############################################################################
def getVarKeys(): return _STAR_vars_STAR.keys()
##############################################################################
def hasVar(sym): return str(sym) in _STAR_vars_STAR
##############################################################################
def addLib(alias, lib):
  #console.log(`adding lib ${alias}`)
  if alias in _STAR_libs_STAR:
    throwE(f"Library alias already added: {alias}")
  _STAR_libs_STAR[alias]= lib
##############################################################################
def prnLn(*xs):
  for a in xs: println(std.prn(a))
##############################################################################
def prnStr(*xs):
  return " ".join([std.prn(a,1) for a in xs])
##############################################################################
def slurp(path):
  data=""
  with open(path, "r") as file:
    data = file.read()
  return data
##############################################################################
def spit(path,data):
  with open(path, "w") as file: file.write(data)
##############################################################################
def clone(obj):
  rc=None
  if std.isVec(obj):
    rc=std.into(std.vector(),obj)
  elif std.isMap(obj):
    rc=obj.copy()
  elif std.isSet(obj):
    rc=obj.copy()
  elif std.isPair(obj):
    rc=std.into(std.pair(),obj)
  elif std.isStr(obj) or type(obj)==list:
    rc=obj[:]
  elif std.isFunction(obj):
    rc=None #TODO
  elif std.isObject(obj):
    rc=copy.copy(obj)
  else:
    throwE(f"clone of non-collection: {obj}")
  return rc
##############################################################################
def withMeta(obj, m):
  obj= clone(obj)
  obj["____meta"] = m
  return obj
##############################################################################
def meta(obj):
  if std.isSimple(obj):
    throwE(f"can't get meta from: {std.rtti(obj)}")
  return obj["____meta"]
##############################################################################
def _macros(fout=None):
  s = std.prn(CACHE)
  spit(fout, s) if fout else println(s)
##############################################################################
def _env(what=None,env=None,fout=None):
  s = std.prn((env or genv()).select(what))
  spit(fout, s) if fout else println(s)
##############################################################################
def _slice(arr,*xs):
  n=len(xs)
  rc=None
  if n==0:
    rc=arr[:]
  elif n==1:
    rc=arr[xs[0]:]
  elif n==2:
    rc=arr[xs[0]:xs[1]]
  elif n==3:
    rc=arr[xs[0]:xs[1]:xs[2]]
  else:
    throwE("bad slice arg")
  return rc
##############################################################################
def _map(f, arr):
  out=std.pair()
  for k,v in enumerate(arr): out.append(f(v,k,arr))
  return out
##############################################################################
def _reset(a,b):
  if std.isAtom(a): a.value=b
  return a
##############################################################################
def _swap(a, f,*xs):
  p= [a.value, *xs]
  a.value = f(*p)
  return a.value
##############################################################################
_intrinsics_ = {
  "macroexpand*" : lambda a,e=None: println(std.prn(expandMacro(a, e or genv()))),
  "macros*": _macros,
  "env*": _env,
  "slice*": _slice,
  "throw*": lambda *xs: throwE("".join(xs)),
  "str*": lambda *xs: "".join([str(x) for x in xs]),

  "obj-type*": std.rtti,
  "gensym*": std.gensym,
  "is-eq?": std.isEQ,

  "is-some?": lambda o: not (o is None),
  "is-str?": lambda a: type(a) == str,

  "false?": lambda a:  a is False,
  "true?": lambda a: a is True,
  "is-nil?": std.isNil,
  "is?": lambda a,b: a is b,

  "is-keyword?": std.isKeyword,
  "is-symbol?": std.isSymbol,
  "keyword*": std.keyword,
  "symbol*": std.symbol,
  "println*": prnLn,
  "prn*": prnStr,
  "slurp*": slurp,
  "spit*": spit,

  "<": lambda a,b: a<b,
  ">": lambda a,b: a > b,

  ">=": lambda a,b: a >= b,
  "<=": lambda a,b: a <= b,

  "/": lambda A,*xs: reduce(lambda a,b: a/b, xs, A),
  "+": lambda *xs: reduce(lambda a,b: a+b, xs, 0),
  "-": lambda A,*xs: reduce(lambda a,b: a-b, xs, A),
  "*": lambda *xs: reduce(lambda a,b: a*b, xs, 1),

  "not=": lambda a,b: not (a is b),
  "=": lambda a,b: a is b,
  "!=": lambda a,b: a != b,
  "==": lambda a,b: a == b,

  "is-contains?": std.contains,
  "is-vector?": std.isVec,
  "is-pair?": std.isPair,
  "is-map?": std.isMap,
  "is-set?": std.isSet,

  "object*": std.jsobj,
  "vector*": std.vector,
  "list*": std.pair,

  "hashmap*": lambda *xs: std.hashmap(*xs),
  "hashset*": lambda *xs: std.hashset(*xs),

  "values*": lambda a: std.into(std.pair(), list(a.values())),
  "keys*": lambda a: std.into(std.pair(), list(a.keys())),

  "get*": lambda a,b: std.getProp(a,b),
  "not*": lambda a:  False if a else True,
  "dec*": lambda a: a - 1,
  "inc*": lambda a: a + 1,

  "is-even?": lambda a: 0 == a%2,
  "is-odd?": lambda a: 1 == a%2,

  "is-sequential?": std.isSequential,
  "concat*": std.concat,
  "count*": std.count,
  "cons*": std.cons,

  "rest*": lambda a: a[1:] if a else std.pair(),

  "nth*": lambda coll,pos: std.getProp(coll,pos),
  "first*": lambda a: std.getProp(a, 0),
  "is-empty?": lambda a: 0 == std.count(a),
  "not-empty*": std.notEmpty,

  "apply*": lambda f,*xs: f(*xs),
  "partition*": std.partition,

  "map*": _map,

  "evens*": std.evens,
  "odds*": std.odds,
  "conj*": std.conj,
  "seq*": std.seq,
  "is-atom?": std.isAtom,
  "atom*": std.atom,

  "deref*": lambda a: a.value if std.isAtom(a) else None,

  "reset*": _reset,
  "swap*": _swap,

  #"meta*": meta,
  #"with-meta*": withMeta,

  "type*": lambda a: type(a)
}
CACHE = dict()
##############################################################################
#Register a new macro
def setMacro(cmd, func):
  if cmd and std.isFunction(func):
    cmd = str(cmd)
    #only add namespace'd macro
    if "/" not in cmd:
      c = core.peekNS()
      if not c:
        throwE(f"setMacro: macro {cmd} has no namespace")
      cmd = f'{c.id}/{cmd}'
    #console.log(`added macro: ${cmd}`);
    CACHE[cmd]= func
  else:
    func=None
  return func
##############################################################################
#Get macro
def getMacro(cmd):
  cmd = str(cmd)
  mc=None
  nsp=None
  skip=False
  if "/" in cmd and len(cmd)>1:
    c = cmd.split("/")
    libObj = getLib(p)
    mname = c
    if p == KBSTDLR:
      #from kirby
      nsp = KBSTDLIB
    elif std.isNichts(libObj) or not std.getProp(libObj, EXPKEY):
      #non standard!
      skip = True
    else:
      nsp = std.getProp(std.getProp(libObj, EXPKEY), "ns")
  else:
    #meta data for the var
    m = getVar(cmd)
    mname = cmd
    nsp = std.getProp(m, "ns") if m else None
  ###
  if not skip:
    if nsp is None and CACHE.get(f"{KBSTDLIB}/{mname}"):
      nsp = KBSTDLIB
    if type(nsp) == str:
      mc=CACHE.get(f"{nsp}/{mname}")
  return mc
##############################################################################
def readAST(s):
  ret = rdr.parse(s)
  if type(ret)==list and len(ret)==1:
    ret = ret[0]
  return ret
##############################################################################
def backtick(ast):
  def lstQ(a): return std.isSequential(a) and std.notEmpty(a)
  if not lstQ(ast):
    rc=std.pair(std.symbol("quote"), ast)
  elif std.isSymbol(ast[0],"unquote"):
    rc=ast[1]
  elif lstQ(ast[0]) and std.isSymbol(ast[0][0],"splice-unquote"):
    rc=std.pair(std.symbol("concat*"), ast[0][1], backtick(ast.slice(1)))
  else:
    rc=std.pair(std.symbol("cons*"), backtick(ast[0]), backtick(ast[1:]))
  return rc
##############################################################################
def isMacroCall(ast,env):
  return std.isPair(ast,1) and std.isSymbol(ast[0]) and getMacro(f"{ast[0]}")
##############################################################################
#Continue to expand if the expr is a macro
def expandMacro(ast,env=None,mcObj=None):
  env=env or genv()
  while mcObj or isMacroCall(ast, env):
    if mcObj:
      mac=mcObj
      mcObj = None
    else:
      cmd = str(ast[0])
      mac = getMacro(cmd)
    #console.log(mac?"found macro!!!":"missing macro!!!");
    ast=ast[1:]
    ast = mac(*ast)
  return ast
##############################################################################
#internal (and* a b c)
def doAND(ast, env):
  ret = True
  i=1
  while i<len(ast):
    ret=compute(ast[i], env)
    print("POO+++" + str(ret))
    if std.isFalsy(ret):
      break
    i+=1
  return ret
##############################################################################
#internal (or* a b c)
def doOR(ast, env):
  ret = None
  i=1
  while i<len(ast):
    ret=compute(ast[i], env)
    if not std.isFalsy(ret): break
    i+=1
  return ret
##############################################################################
#internal (let* [x 1 y 2] ...)
def doLET(ast, env):
  binds = ast[1]
  e = LEXEnv(env)
  i=0
  while i<len(binds):
    e.set(binds[i], compute(binds[i+1], e))
    i+=2
  return std.pair(ast[2], e)
##############################################################################
#internal (macro* name (args) body)
def doMACRO(ast, env):
  cmd= str(ast[1])
  name=cmd
  nsp = core.peekNS()
  nsp = nsp.id if nsp else KBSTDLIB
  #ast[2]===args, ast[3]===body
  mc= fnToNative(ast[2], ast[3], env)
  if "/" not in cmd:
    name= f"{nsp}/{cmd}"
    env.set(std.symbol(cmd),mc)
  setMacro(name, mc)
##############################################################################
#internal (try blah )
def doTRY(ast, env):
  a3 = ast[2]
  try:
    return compute(ast[1], env)
  except Exception as e:
    if a3 and "catch*" == str(a3[0]):
      e = str(e)
      return compute(a3[2], LEXEnv(env, [a3[1]], [e]))
    raise e
##############################################################################
#internal (if test ok elze), only test is eval'ed, ok and elze are not.
def doIF(ast, env):
  a3 = ast[3]
  test = compute(ast[1], env)
  return ast[2] if not std.isFalsy(test) else  (a3 or None)
##############################################################################
#Wrap the function body and args inside a native js function
def fnToNative(fargs, fbody, env):
  #wrap around a macro
  return lambda *args: compute(fbody, LEXEnv(env, fargs, args))
##############################################################################
def _do(a,e):
  for x in a[1:-1]: evalEx(x,e)
  return std.pair(a[-1], e)
##############################################################################
_spec_forms_ = {

  "lambda*": lambda a,env: std.atom(fnToNative(a[1], a[2], env)),
  #a[1] == args a[2] == body
  "def*": lambda a,e: std.atom(e.set(a[1], compute(a[2], e))),

  "and*": lambda a,b: std.atom(doAND(a,b)),
  "or*": lambda a,b: std.atom(doOR(a,b)),

  "quote": lambda a,b: std.atom(a[1]),
  "let*": lambda a,b: doLET(a,b),

  "syntax-quote": lambda a,b: std.pair(backtick(a[1]), b),
  "macro*": lambda a,b: std.atom(doMACRO(a,b)),
  "try*": lambda a,b: std.atom(doTRY(a,b)),
  "if*": lambda a,b: std.pair(doIF(a,b), b),

  "do*": _do
}
##############################################################################
#Process the ast
def evalEx(ast, env):
  rc=ast
  if std.isStr(ast):
    rc=std.unquoteStr(ast)
  elif std.isNil(ast):
    rc=None
  elif std.isSimple(ast):
    #primitive data
    rc=ast
  elif std.isKeyword(ast):
    #keyword data
    rc=str(ast)
  elif std.isSymbol(ast):
    #var data
    rc=env.get(ast)
  elif std.isVec(ast):
    for i,v in enumerate(ast):
      ast[i]=compute(v,env)
  elif std.isMap(ast) or std.isSet(ast):
    pass
  elif std.isPair(ast):
    rc=std.pair()
    for v in ast:
      rc.append(compute(v,env))
  else:
    throwE(f"eval* failed: {std.prn(ast,1)}")
  return rc
##############################################################################
#Interpret a expression
def compute(expr, cenv=None):
  _r_=None
  _x_=None
  _zz_=std.Atom("!")
  recur=None
  env = cenv or genv()
  def _f_(ast):
    nonlocal env
    if not std.isPair(ast):
      res=std.atom(evalEx(ast, env))
    elif 0==len(ast):
      res=std.atom(std.pair())
    else:
      cmd = str(ast[0])
      cmd = _spec_forms_.get(cmd)
      if std.isFunction(cmd):
        res=cmd(ast,env)
      else: #a general form
        res=[compute(a,env) for a in ast]
        cmd=res[0]
        res=std.atom(res if not std.isFunction(cmd) else cmd(*res[1:]))
    ###
    if std.isPair(res):
      env= res[1]
      res= recur(expandMacro(res[0], env))
    return res
  ####
  _r_ = _f_
  def _loop(*xs):
    nonlocal _zz_
    nonlocal _x_
    nonlocal _r_
    _x_ = xs
    if not (_r_ is _zz_):
      _r_ = _zz_
      while _r_ is _zz_: _r_ = _f_(*_x_)
      return _r_
    return _zz_
  recur=_loop
  ret= recur(expandMacro(expr, env))
  return None if ret.value is None else ret.value
##############################################################################
#Create a new interpreter environment
def newEnv():
  ret = LEXEnv()
  for k,v in _intrinsics_.items(): ret.set(std.symbol(k), v)
  return ret
##############################################################################
class Repl(Cmd):
  prompt="kirby> "
  intro= ""
  def do_exit(self, inp):
    print("Bye")
    return True
  def help_exit(self):
    print("exit the repl. Shorthand: x q Ctrl-D.")
  def default(self, line):
    if line == "x" or line == "q": return self.do_exit(line)
    try:
      println(std.prn(compute(expandMacro(readAST(line)))))
    except Exception as e:
      println(f"Error: {e}")
  do_EOF = do_exit
  help_EOF = help_exit
##############################################################################
#Start a interactive session
def runRepl(ver):
  init(ver)
  Repl.intro= f"Kirby REPL v{_STAR_version_STAR}"
  Repl().cmdloop()
##############################################################################
#Set up the runtime environment
def init(ver):
  global inited
  global g_env
  global _STAR_version_STAR
  if not inited:
    lib=dict()
    inited= True
    g_env = newEnv()
    addLib(core.peekNS().id,lib)
    _STAR_version_STAR = ver
    lib[EXPKEY]=dict(ns= "user", vars= [], macros= dict())
  return inited
##############################################################################
#Returns the runtime environment
def genv(): return g_env
##############################################################################
#EOF
if __name__ == "__main__":
  runRepl("1.0")
