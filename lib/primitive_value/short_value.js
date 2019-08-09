'use strict';

const PrimitiveValue = require('./');

class ShortValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theShortType;
  }
}

module.exports = ShortValue;
