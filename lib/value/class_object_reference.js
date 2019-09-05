'use strict';

const {
  ReflectedType,
} = require('../command').ClassObjectReference;
const ObjectReference = require('./object_reference');

class ClassObjectReference extends ObjectReference {
  constructor(vm, ref) {
    super(vm, ref);
    this.reflectedType = null;
  }


  async getReflectedType() {
    if (!this.reflectedType) {
      const { typeID, refTypeTag } = await this.vm.send(new ReflectedType(this.ref));
      this.reflectedType = this.vm.referenceType(typeID, refTypeTag);
    }
    return this.reflectedType;
  }

  get typeValueKey() { return 99; }
}

module.exports = ClassObjectReference;
