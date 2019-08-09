'use strict';

const PrimitiveValue = require('./');

class CharValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theCharType;
  }
}

module.exports = CharValue;
