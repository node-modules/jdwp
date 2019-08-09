'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Frames extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 6;
  }

  encode() {
    return this.allocate(8 + ByteBuffer.getObjectIDSize())
      .putThreadID(this.data.thread)
      .putInt(this.data.startFrame)
      .putInt(this.data.length)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const len = data.getInt();
    const frames = [];
    for (let i = 0; i < len; i++) {
      frames.push({
        frameID: data.getFrameID(),
        location: data.getLocation(),
      });
    }
    return { frames };
  }
}

module.exports = Frames;
