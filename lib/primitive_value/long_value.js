'use strict';

const PrimitiveValue = require('./');

class LongValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theLongType;
  }
}

module.exports = LongValue;
