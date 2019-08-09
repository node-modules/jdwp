'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Length extends Base {
  get commandSet() {
    return 13;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putObjectID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    return {
      arrayLength: data.getInt(),
    };
  }
}

module.exports = Length;
