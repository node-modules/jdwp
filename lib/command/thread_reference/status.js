'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Status extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 4;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putThreadID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      threadStatus: obj.data.getInt(),
      suspendStatus: obj.data.getInt(),
    };
  }
}

module.exports = Status;
