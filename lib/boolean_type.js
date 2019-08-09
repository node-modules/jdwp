'use strict';

const PrimitiveType = require('./primitive_type');

class BooleanType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'Z';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = BooleanType;
