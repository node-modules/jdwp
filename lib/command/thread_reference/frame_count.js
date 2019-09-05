'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class FrameCount extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 7;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putThreadID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      frameCount: obj.data.getInt(),
    };
  }
}

module.exports = FrameCount;
