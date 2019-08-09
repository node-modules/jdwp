'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ForceEarlyReturn extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 14;
  }

  encode() {
    const { thread, value } = this.data;
    return this.allocate(ByteBuffer.getObjectIDSize() + 9)
      .putThreadID(thread)
      .putValue(value)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = ForceEarlyReturn;
