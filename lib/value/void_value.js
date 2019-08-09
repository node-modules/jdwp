'use strict';

const Value = require('../value');

class VoidValue extends Value {
  get typeValueKey() {
    return 86;
  }

  async getType() {
    return this.vm.theVoidType;
  }

  async prepareForAssignmentTo(destination) {
    if (destination.typeName === 'void') {
      return {
        tag: this.typeValueKey,
        value: null,
      };
    }
    throw new Error('invalid type');
  }
}

module.exports = VoidValue;
