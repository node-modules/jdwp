'use strict';

const PrimitiveValue = require('./');

class DoubleValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theDoubleType;
  }
}

module.exports = DoubleValue;
