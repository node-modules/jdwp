'use strict';

const PrimitiveType = require('./primitive_type');

class IntegerType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'I';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = IntegerType;
