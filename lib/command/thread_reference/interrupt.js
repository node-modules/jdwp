'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Interrupt extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 11;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putThreadID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = Interrupt;
