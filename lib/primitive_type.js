'use strict';

const Type = require('./type');

class PrimitiveType extends Type {
  get tag() {
    return this.signature.charCodeAt(0);
  }

  convert(value) {
    return {
      tag: this.tag,
      value: value.value,
    };
  }
}

module.exports = PrimitiveType;
