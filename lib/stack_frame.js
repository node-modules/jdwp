'use strict';

const {
  GetValues,
  ThisObject,
  SetValues,
  PopFrames,
} = require('./command').StackFrame;
const Location = require('./location');
const LocalCache = require('./local_cache');

class StackFrame {
  constructor(vm, thread, id, location) {
    this.vm = vm;
    this.thread = thread;
    this.id = id;
    this.location = new Location(vm, null, location.index);
    this.location.methodRef = location.methodID;
    this.location.declaringType = vm.referenceType(location.classID, location.typeTag, null);
    this._visibleVariables = null;
    this._thisObject = null;
    this.isValid = true;
  }

  async currentMethod() {
    return await this.location.getMethod();
  }

  async createVisibleVariables() {
    if (!this._visibleVariables) {
      const method = await this.location.getMethod();
      const allVariables = await method.getVariables();
      const map = new Map();

      for (const variable of allVariables) {
        const name = variable.name;
        if (variable.isVisible(this)) {
          const existing = map.get(name);
          if (existing == null || variable.hides(existing)) {
            map.set(name, variable);
          }
        }
      }
      this._visibleVariables = map;
    }
  }

  async visibleVariables() {
    await this.createVisibleVariables();
    return Array.from(this._visibleVariables.values()).sort((v1, v2) => {
      let r = v1.scopeStart.codeIndex - v2.scopeStart.codeIndex;
      if (r === 0) {
        r = v1.slot - v2.slot;
      }
      return r;
    });
  }

  async visibleVariableByName(name) {
    await this.createVisibleVariables();
    return this._visibleVariables.get(name);
  }

  async getValue(variable) {
    const values = await this.getValues([ variable ]);
    return values[0];
  }

  async getValues(variables) {
    const { values } = await this.vm.send(new GetValues({
      thread: this.thread.ref,
      frame: this.id,
      slots: variables.map(v => {
        return {
          slot: v.slot,
          sigbyte: v.signature.charCodeAt(0),
        };
      }),
    }));
    if (values.length !== variables.length) throw new Error('Wrong number of values returned from target VM');
    return values;
  }

  async setValue(localVariable, value) {
    if (!localVariable.isVisible(this)) {
      throw new Error(localVariable.name + ' is not valid at this frame location');
    }
    await this.vm.send(new SetValues({
      thread: this.thread.ref,
      frame: this.id,
      slotValues: [{
        slot: localVariable.slot,
        slotValue: value,
      }],
    }));
  }

  async thisObject() {
    const method = await this.location.getMethod();
    if (method.isStatic || method.isNative) return null;

    if (!this._thisObject) {
      const { objectThis } = await this.vm.send(new ThisObject({
        thread: this.thread.ref,
        frame: this.id,
      }));
      this._thisObject = objectThis;
    }
    return this._thisObject;
  }

  validateStackFrame() {
    if (!this.isValid) throw new Error('Thread has been resumed');
  }

  async pop() {
    await this.vm.send(new PopFrames({
      thread: this.thread.ref,
      frame: this.id,
    }));
    LocalCache.reset();
  }
}

module.exports = StackFrame;
