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
import copy,types
##############################################################################
_STAR_ns_DASH_cache_STAR =[ types.SimpleNamespace(id="user",meta=None) ]
##############################################################################
#current at the end
def peekNS():
  return _STAR_ns_DASH_cache_STAR[-1]
##############################################################################
#at least one left
def popNS():
  if len(_STAR_ns_DASH_cache_STAR) > 1:
    return _STAR_ns_DASH_cache_STAR.pop()
##############################################################################
#add to the end
def pushNS(nsp,info):
  _STAR_ns_DASH_cache_STAR.append( types.SimpleNamespace(id=nsp,meta=info))
  return peekNS()
##############################################################################
#*ns*
def starNSstar(): return peekNS()["id"]
##############################################################################
#https://stackoverflow.com/questions/8180014/how-to-subclass-python-list-without-type-problems
class SPair(list):
  def __init__(self):
    self.____sci=types.SimpleNamespace(line=0,column=0,source="")
  def __getslice__(self,i,j):
    return SPair(list.__getslice__(self, i, j))
  def __add__(self,other):
    return SPair(list.__add__(self,other))
  def __mul__(self,other):
    return SPair(list.__mul__(self,other))
  def __getitem__(self, item):
    r= list.__getitem__(self, item)
    try:
      return SPair(r)
    except TypeError:
      return r
##############################################################################
#same as SPair
class DArray(list):
  def __init__(self):
    self.____sci=types.SimpleNamespace(line=0,column=0,source="")
  def __getslice__(self,i,j):
    return DArray(list.__getslice__(self, i, j))
  def __add__(self,other):
    return DArray(list.__add__(self,other))
  def __mul__(self,other):
    return DArray(list.__mul__(self,other))
  def __getitem__(self, item):
    r= list.__getitem__(self, item)
    try:
      return DArray(r)
    except TypeError:
      return r
##############################################################################
#@abstract
class SValue:
  def __init__(self,a):
    self.____sci= types.SimpleNamespace(line=0,column=0,source="")
    self.value=a
  @property
  def line(self): return self.____sci.line
  @line.setter
  def line(self, n): self.____sci.line=n
  @property
  def column(self): return self.____sci.column
  @column.setter
  def column(self, n): self.____sci.column=n
  @property
  def source(self): return self.____sci.source
  @source.setter
  def source(self, s): self.____sci.source=s
  def __str__(self): return self.value
  def __repr_(self): return self.__str__()
##############################################################################
class Keyword(SValue):
  def __init__(self,name): super().__init__(name)
  def __str__(self): return f"{starNSstar()}/{self.value[2:]}" if self.value.startswith("::") else (self.value[1:] if self.value.startswith(":") else None)
##############################################################################
class SSymbol(SValue):
  def __init__(self,s): super().__init__(s)
##############################################################################
class Atom(SValue):
  def __init__(self,v): super().__init__(v)
##############################################################################
class Null(SValue):
  def __init__(self): super().__init__(None)
##############################################################################
class JSObj():
  def __init__(self):
    self.____sci=types.SimpleNamespace(line=0,column=0,source="")
  def __copy__(self):
    out=type(self)()
    for k,v in vars(self).items():
      if k.endswith("____sci"):
        out._JSObj____sci.column=v.column
        out._JSObj____sci.source=v.source
        out._JSObj____sci.line=v.line
      else:
        setattr(out,k,v)
    return out
##############################################################################
def hasSCI(o):
  try:
    if o:
      for x in vars(o).keys():
        if x.endswith("____sci"): return True
  except:
    pass
##############################################################################
#EOF
def main():
  x=DArray()
  x.extend([1,2,3])
  x.line=8
  print(hasSCI(x))



if __name__ == "__main__":
  main()
