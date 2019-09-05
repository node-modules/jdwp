'use strict';

const PrimitiveValue = require('./');

class ByteValue extends PrimitiveValue {
  constructor(vm, value) {
    super(vm);
    this.value = value;
  }

  async getType() {
    return this.vm.theByteType;
  }
}

module.exports = ByteValue;
