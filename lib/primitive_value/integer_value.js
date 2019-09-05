'use strict';

const PrimitiveValue = require('./');

class IntegerValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theIntegerType;
  }
}

module.exports = IntegerValue;
