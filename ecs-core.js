/*Auto generated by Kirby v1.0.0 - Fri Mar 16 2018 17:12:21 GMT-0700 (PDT)
  czlab.elmo.ecs.core
{"doc" "" "author" "Kenneth Leung"}
*/

const ky = require("kirby");
const Atom = ky["Atom"];
const atom = ky["atom"];
const swap_BANG = ky["swap_BANG"];
const println = ky["println"];
const nichts_QMRK = ky["nichts_QMRK"];
const seq = ky["seq"];
const prn = ky["prn"];
const object_QMRK = ky["object_QMRK"];
const partition = ky["partition"];
const conj_BANG = ky["conj_BANG"];
const disj_BANG = ky["disj_BANG"];
const kirbystdlibref = require("kirby");
const __module_namespace__ = "czlab.elmo.ecs.core";
////////////////////////////////////////////////////////////////////////////////
//fn: [createPool] in file: ecs-core.ky, line: 18
const createPool = function(ctor, init, batch) {
  if ( (!(((typeof (ctor) === "function")) && ((typeof (init) === "function")))) ) {
    throw Error("Precondition failed");
  } else {
    null;
  }
  return atom({
    "size": 0,
    "next": 0,
    "slots": [],
    "ctor": ctor,
    "init": init,
    "batch": batch
  });
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getPoolSize] in file: ecs-core.ky, line: 25
const getPoolSize = function(pool) {
  return kirbystdlibref.getProp(pool.value, "size");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getPoolUsed] in file: ecs-core.ky, line: 28
const getPoolUsed = function(pool) {
  return kirbystdlibref.getProp(pool.value, "next");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [takeFromPool] in file: ecs-core.ky, line: 31
const takeFromPool = function(pool) {
  let co = undefined;
  let ret = null;
  swap_BANG(pool, function(root) {
    let size = kirbystdlibref.getProp(root, "size");
    let next = kirbystdlibref.getProp(root, "next");
    let slots = kirbystdlibref.getProp(root, "slots");
    let batch = kirbystdlibref.getProp(root, "batch");
    let ctor = kirbystdlibref.getProp(root, "ctor");
    if ( (next >= size) ) {
      for (let x = 0, GS__4 = batch, ____break = false; ((!____break) && (x < GS__4)); x = (x + 1)) {
        (
        co = ctor());
        conj_BANG(slots, co);
        (
        co["____pool"] = pool);
      }
      (root["size"] = (batch + size));
    }
    (ret = slots[next]);
    (ret["____status"] = true, ret["____slot"] = next);
    (
    root["next"] = (next + 1));
    return root;
  });
  return ret;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [returnToPool] in file: ecs-core.ky, line: 49
const returnToPool = function(pool, obj) {
  if ( (!(nichts_QMRK(obj) || (obj.____pool !== pool))) ) {
    swap_BANG(pool, function(root) {
      let init = kirbystdlibref.getProp(root, "init");
      let next = kirbystdlibref.getProp(root, "next");
      let slots = kirbystdlibref.getProp(root, "slots");
      if (kirbystdlibref.getProp(obj, "____status")) {
        (
        root["next"] = (next - 1));
        init(obj);
        let tail = slots[root.next];
        let slot_QUOT = kirbystdlibref.getProp(tail, "____slot");
        let epos_QUOT = kirbystdlibref.getProp(obj, "____slot");
        (slots[root.next] = obj, slots[epos_QUOT] = tail);
        (
        tail["____slot"] = epos_QUOT);
        (obj["____slot"] = slot_QUOT, obj["____status"] = false);
      }
      return root;
    });
  } else {
    null;
  }
  return pool;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [createECS] in file: ecs-core.ky, line: 70
const createECS = function() {
  return atom((new Map([["entities",(new Set([]))], ["templates",(new Map([]))], ["registry",(new Map([]))], ["data",(new Map([]))], ["systems", []], ["uid", 1]])));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [genUid] in file: ecs-core.ky, line: 78
const genUid = function(ecs) {
  let ret = 0;
  swap_BANG(ecs, function(root) {
    let uid = kirbystdlibref.getProp(root, "uid");
    (
    ret = uid);
    return (kirbystdlibref.assoc_BANG(root, "uid", (uid + 1)));
  });
  return ["e@", ret].join("");
};
////////////////////////////////////////////////////////////////////////////////
//fn: [retUsed] in file: ecs-core.ky, line: 86
const retUsed = function(obj) {
  return (((Object.prototype.toString.call(obj) === "[object Map]")) ?
    retUsed(Array.from(obj.values())) :
    ((Array.isArray(obj)) ?
      obj.forEach(function(c) {
        return ((c && c.____pool) ?
          returnToPool(c.____pool, c) :
          null);
      }) :
      (object_QMRK(obj) ?
        (obj.____pool ?
          returnToPool(obj.____pool, obj) :
          null) :
        null)));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [createEntity] in file: ecs-core.ky, line: 99
const createEntity = function(ecs, componentId) {
  let moreIds = Array.prototype.slice.call(arguments, 2);
  return (function() {
    let entity = genUid(ecs);
    addToEntity.apply(this, [ecs, entity].concat(componentId, moreIds));
    swap_BANG(ecs, function(root) {
      let entities = kirbystdlibref.getProp(root, "entities");
      conj_BANG(entities, entity);
      return root;
    });
    return entity;
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [removeEntity] in file: ecs-core.ky, line: 110
const removeEntity = function(ecs, entity) {
  let more = Array.prototype.slice.call(arguments, 2);
  let c = undefined;
  let ents = [entity].concat(more);
  swap_BANG(ecs, function(root) {
    let entities = kirbystdlibref.getProp(root, "entities");
    let data = kirbystdlibref.getProp(root, "data");
    let registry = kirbystdlibref.getProp(root, "registry");
    Array.from(registry.keys()).forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return (function() {
        let GS__9 = kirbystdlibref.getProp(data, ____args[0]);
        let co = GS__9;
        return ((((typeof (GS__9) === "undefined")) || ((GS__9 === null))) ?
          null :
          ents.forEach(function(e) {
            retUsed(kirbystdlibref.getProp(co, e));
            return kirbystdlibref.dissoc_BANG(co, e);
          }));
      }).call(this);
    });
    ents.forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return disj_BANG(entities, ____args[0]);
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [addComponent] in file: ecs-core.ky, line: 123
const addComponent = function(ecs, id, component) {
  let more = Array.prototype.slice.call(arguments, 3);
  swap_BANG(ecs, function(root) {
    let registry = kirbystdlibref.getProp(root, "registry");
    partition(2, [id, component].concat(more)).forEach(function(GS__11) {
      let a = kirbystdlibref.getIndex(GS__11, 0);
      let b = kirbystdlibref.getIndex(GS__11, 1);
      return (kirbystdlibref.assoc_BANG(registry, a, b));
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [removeComponent] in file: ecs-core.ky, line: 131
const removeComponent = function(ecs, id) {
  let more = Array.prototype.slice.call(arguments, 2);
  swap_BANG(ecs, function(root) {
    let data = kirbystdlibref.getProp(root, "data");
    let registry = kirbystdlibref.getProp(root, "registry");
    [id].concat(more).forEach(function(c) {
      kirbystdlibref.dissoc_BANG(registry, c);
      retUsed(kirbystdlibref.getProp(data, c));
      return kirbystdlibref.dissoc_BANG(data, c);
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [addToEntity] in file: ecs-core.ky, line: 140
const addToEntity = function(ecs, entity, componentId) {
  let moreIds = Array.prototype.slice.call(arguments, 3);
  swap_BANG(ecs, function(root) {
    let data = kirbystdlibref.getProp(root, "data");
    let registry = kirbystdlibref.getProp(root, "registry");
    let ctor = null;
    let co = null;
    [componentId].concat(moreIds).forEach(function(cid) {
      (
      ctor = kirbystdlibref.getProp(registry, cid));
      if ( (!ctor) ) {
        throw new Error(["Unknown component ", cid].join(""));
      } else {
        null;
      }
      if ( (!data.has(cid)) ) {
        (kirbystdlibref.assoc_BANG(data, cid, (new Map([]))));
      } else {
        null;
      }
      (co = ctor());
      (
      co["____entity"] = entity);
      return (kirbystdlibref.assoc_BANG(kirbystdlibref.getProp(data, cid), entity, co));
    });
    return root;
  });
  return entity;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [removeFromEntity] in file: ecs-core.ky, line: 154
const removeFromEntity = function(ecs, entity) {
  let componentIds = Array.prototype.slice.call(arguments, 2);
  swap_BANG(ecs, function(root) {
    let data = kirbystdlibref.getProp(root, "data");
    componentIds.forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return (function() {
        let GS__15 = kirbystdlibref.getProp(data, ____args[0]);
        let co = GS__15;
        return ((!(((typeof (GS__15) === "undefined")) || ((GS__15 === null)))) ?
          (function() {
            retUsed(kirbystdlibref.getProp(co, entity));
            return kirbystdlibref.dissoc_BANG(co, entity);
          }).call(this) :
          null);
      }).call(this);
    });
    return root;
  });
  return entity;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getEntityData] in file: ecs-core.ky, line: 162
const getEntityData = function(ecs, entity, componentId) {
  let d = kirbystdlibref.getProp(ecs.value, "data");
  let c = kirbystdlibref.getProp(d, componentId);
  return (c ?
    kirbystdlibref.getProp(c, entity) :
    undefined);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [updateEntity] in file: ecs-core.ky, line: 168
const updateEntity = function(ecs, entity, componentId, func) {
  swap_BANG(ecs, function(root) {
    let data = kirbystdlibref.getProp(root, "data");
    let GS__17 = getEntityData(ecs, entity, componentId);
    let c = GS__17;
    if ( (((typeof (GS__17) === "undefined")) || ((GS__17 === null))) ) {
      null;
    } else {
      func(c);
    }
    return root;
  });
  return entity;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getComponentsData] in file: ecs-core.ky, line: 175
const getComponentsData = function(ecs, componentId) {
  let d = kirbystdlibref.getProp(ecs.value, "data");
  return (function() {
    let GS__18 = kirbystdlibref.getProp(d, componentId);
    let c = GS__18;
    return ((((typeof (GS__18) === "undefined")) || ((GS__18 === null))) ?
      [] :
      Array.from(c.values()));
  }).call(this);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getComponentKeys] in file: ecs-core.ky, line: 180
const getComponentKeys = function(ecs) {
  return Array.from(kirbystdlibref.getProp(ecs.value, "registry").keys());
};
////////////////////////////////////////////////////////////////////////////////
//fn: [findComponent] in file: ecs-core.ky, line: 183
const findComponent = function(ecs, componentId) {
  return kirbystdlibref.getProp(kirbystdlibref.getProp(ecs.value, "registry"), componentId);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [componentInEntity?] in file: ecs-core.ky, line: 187
const componentInEntity_QMRK = function(ecs, entity, componentId) {
  let moreIds = Array.prototype.slice.call(arguments, 3);
  let d = kirbystdlibref.getProp(ecs.value, "data");
  return (![componentId].concat(moreIds).some(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return (function() {
      let GS__19 = kirbystdlibref.getProp(d, ____args[0]);
      let co = GS__19;
      return ((((typeof (GS__19) === "undefined")) || ((GS__19 === null))) ?
        false :
        (!co.has(entity)));
    }).call(this);
  }));
};
////////////////////////////////////////////////////////////////////////////////
//fn: [addTemplate] in file: ecs-core.ky, line: 194
const addTemplate = function(ecs, id, template) {
  let more = Array.prototype.slice.call(arguments, 3);
  swap_BANG(ecs, function(root) {
    let templates = kirbystdlibref.getProp(root, "templates");
    partition(2, [id, template].concat(more)).forEach(function(GS__21) {
      let a = kirbystdlibref.getIndex(GS__21, 0);
      let b = kirbystdlibref.getIndex(GS__21, 1);
      return (kirbystdlibref.assoc_BANG(templates, a, b));
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [getTemplateKeys] in file: ecs-core.ky, line: 203
const getTemplateKeys = function(ecs) {
  return Array.from(kirbystdlibref.getProp(ecs.value, "templates").keys());
};
////////////////////////////////////////////////////////////////////////////////
//fn: [findTemplate] in file: ecs-core.ky, line: 206
const findTemplate = function(ecs, templateId) {
  return kirbystdlibref.getProp(kirbystdlibref.getProp(ecs.value, "templates"), templateId);
};
////////////////////////////////////////////////////////////////////////////////
//fn: [removeTemplate] in file: ecs-core.ky, line: 210
const removeTemplate = function(ecs, id) {
  let moreIds = Array.prototype.slice.call(arguments, 2);
  swap_BANG(ecs, function(root) {
    let templates = kirbystdlibref.getProp(root, "templates");
    [id].concat(moreIds).forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return kirbystdlibref.dissoc_BANG(templates, ____args[0]);
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [createTemplateEntity] in file: ecs-core.ky, line: 217
const createTemplateEntity = function(ecs, id) {
  let entity = null;
  swap_BANG(ecs, function(root) {
    let templates = kirbystdlibref.getProp(root, "templates");
    let t = kirbystdlibref.getProp(templates, id);
    (entity = createEntity.apply(this, [ecs].concat(seq(t.components))));
    if (( (typeof (t.initor) === "function") )) {
      t.initor(ecs, entity);
    }
    return root;
  });
  return entity;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [addSystem] in file: ecs-core.ky, line: 230
const addSystem = function(ecs, system) {
  let more = Array.prototype.slice.call(arguments, 2);
  if ( (!(((typeof (system) === "function")))) ) {
    throw Error("Precondition failed");
  } else {
    null;
  }
  swap_BANG(ecs, function(root) {
    let systems = kirbystdlibref.getProp(root, "systems");
    [system].concat(more).forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return conj_BANG(systems, ____args[0]);
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [removeSystem] in file: ecs-core.ky, line: 238
const removeSystem = function(ecs, system) {
  let more = Array.prototype.slice.call(arguments, 2);
  swap_BANG(ecs, function(root) {
    let systems = kirbystdlibref.getProp(root, "systems");
    [system].concat(more).forEach(function() {
      let ____args = Array.prototype.slice.call(arguments);
      return (function() {
        let i = systems.indexOf(____args[0]);
        return ((!((i < 0))) ?
          systems.splice(i, 1) :
          null);
      }).call(this);
    });
    return root;
  });
  return ecs;
};
////////////////////////////////////////////////////////////////////////////////
//fn: [updateECS] in file: ecs-core.ky, line: 247
const updateECS = function(ecs, dt) {
  kirbystdlibref.getProp(ecs.value, "systems").forEach(function() {
    let ____args = Array.prototype.slice.call(arguments);
    return ____args[0](ecs, dt);
  });
  return ecs;
};
module.exports = {
  da57bc0172fb42438a11e6e8778f36fb: {
    ns: "czlab.elmo.ecs.core",
    macros: {}
  },
  createPool: createPool,
  getPoolSize: getPoolSize,
  getPoolUsed: getPoolUsed,
  takeFromPool: takeFromPool,
  returnToPool: returnToPool,
  createECS: createECS,
  createEntity: createEntity,
  removeEntity: removeEntity,
  addComponent: addComponent,
  removeComponent: removeComponent,
  addToEntity: addToEntity,
  removeFromEntity: removeFromEntity,
  getEntityData: getEntityData,
  updateEntity: updateEntity,
  getComponentsData: getComponentsData,
  getComponentKeys: getComponentKeys,
  findComponent: findComponent,
  componentInEntity_QMRK: componentInEntity_QMRK,
  addTemplate: addTemplate,
  getTemplateKeys: getTemplateKeys,
  findTemplate: findTemplate,
  removeTemplate: removeTemplate,
  createTemplateEntity: createTemplateEntity,
  addSystem: addSystem,
  removeSystem: removeSystem,
  updateECS: updateECS
};