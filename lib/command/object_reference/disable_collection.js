'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class DisableCollection extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 7;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putObjectID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode } = obj;
    checkError(errorCode);
    return;
  }
}

module.exports = DisableCollection;
