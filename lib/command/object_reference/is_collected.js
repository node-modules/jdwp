'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class IsCollected extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 9;
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
      isCollected: data.getBoolean(),
    };
  }
}

module.exports = IsCollected;
