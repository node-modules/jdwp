'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class PopFrames extends Base {
  get commandSet() {
    return 16;
  }

  get command() {
    return 4;
  }

  encode() {
    const { thread, frame } = this.data;
    return this.allocate(ByteBuffer.getObjectIDSize() + ByteBuffer.getFrameIDSize())
      .putThreadID(thread)
      .putFrameID(frame)
      .copy();
  }

  decode(obj) {
    const { errorCode } = obj;
    checkError(errorCode);
    return null;
  }
}

module.exports = PopFrames;
