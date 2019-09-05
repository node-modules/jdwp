'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Status extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 9;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      status: obj.data.getInt(),
    };
  }
}

module.exports = Status;
