'use strict';

const PrimitiveValue = require('./');

class FloatValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theFloatType;
  }
}

module.exports = FloatValue;
