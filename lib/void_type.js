'use strict';

const Type = require('./type');

class VoidType extends Type {
  constructor(vm) {
    super(vm);
    this.signature = 'V';
  }

  async getSignature() {
    return this.signature;
  }
}

module.exports = VoidType;
