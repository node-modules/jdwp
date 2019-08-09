'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Modifiers extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 3;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      modBits: obj.data.getInt(),
    };
  }
}

module.exports = Modifiers;
