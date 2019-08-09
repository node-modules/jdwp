'use strict';

class Value {
  constructor(vm) {
    this.vm = vm;
  }

  get typeValueKey() {
    throw new Error('not implement');
  }

  async getType() {
    throw new Error('not implement');
  }

  async prepareForAssignmentTo() {
    throw new Error('not implement');
  }

  static async prepareForAssignment(value, destination) {
    if (value == null) {
      if (destination.signature.length === 1) {
        throw new Error('Can\'t set a primitive type to null');
      }
      return null;
    }
    return await value.prepareForAssignmentTo(destination);
  }
}

module.exports = Value;
