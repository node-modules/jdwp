'use strict';

const PrimitiveValue = require('./');

class BooleanValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theBooleanType;
  }
}

module.exports = BooleanValue;
