'use strict';

const PrimitiveType = require('./primitive_type');

class CharType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'C';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = CharType;
