'use strict';

const PrimitiveType = require('./primitive_type');

class FloatType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'F';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = FloatType;
