'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Stop extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 10;
  }

  encode() {
    const { thread, throwable } = this.data;
    return this.allocate(ByteBuffer.getObjectIDSize() * 2)
      .putThreadID(thread)
      .putObjectID(throwable)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = Stop;
