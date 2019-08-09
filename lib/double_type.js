'use strict';

const PrimitiveType = require('./primitive_type');

class DoubleType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'D';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = DoubleType;
