'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ThisObject extends Base {
  get commandSet() {
    return 16;
  }

  get command() {
    return 3;
  }

  encode() {
    const { thread, frame } = this.data;
    const len = ByteBuffer.getObjectIDSize() + ByteBuffer.getFrameIDSize();
    return this.allocate(len)
      .putThreadID(thread)
      .putFrameID(frame)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    return {
      objectThis: data.getTaggedObjectID(),
    };
  }
}

module.exports = ThisObject;
