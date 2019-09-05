'use strict';

const Value = require('../value');

class PrimitiveValue extends Value {
  async prepareForAssignmentTo(destination) {
    if (destination.signature.length > 1) {
      throw new Error('Can\'t assign primitive value to object');
    }
    const type = await this.getType();
    const signature = await type.getSignature();
    if (destination.signature[0] === 'Z' && signature[0] !== 'Z') {
      throw new Error('Can\'t assign non-boolean value to a boolean');
    }
    if (destination.signature[0] !== 'Z' && signature[0] === 'Z') {
      throw new Error('Can\'t assign boolean value to an non-boolean');
    }
    if (destination.typeName === 'void') {
      throw new Error('Can\'t assign primitive value to a void');
    }
    const primitiveType = destination.type;
    return primitiveType.convert(this);
  }
}

module.exports = PrimitiveValue;
