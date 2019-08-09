'use strict';

const PrimitiveType = require('./primitive_type');

class ShortType extends PrimitiveType {
  constructor(vm) {
    super(vm);
    this.signature = 'S';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = ShortType;
