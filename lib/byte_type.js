'use strict';

const PrimitiveType = require('./primitive_type');

class ByteType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'B';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = ByteType;
