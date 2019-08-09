'use strict';

const {
  Value,
} = require('../command').StringReference;
const ObjectReference = require('./object_reference');

class StringReference extends ObjectReference {

  constructor(vm, ref) {
    super(vm, ref);
    this.value = null;
  }

  async getValue() {
    if (this.value == null) {
      const { stringValue } = await this.vm.send(new Value(this.ref));
      this.value = stringValue;
    }
    return this.value;
  }

  get typeValueKey() { return 115; }
}

module.exports = StringReference;
