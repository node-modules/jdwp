'use strict';

const PrimitiveType = require('./primitive_type');

class LongType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'J';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = LongType;
