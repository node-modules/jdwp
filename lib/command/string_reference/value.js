'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Value extends Base {
  get commandSet() {
    return 10;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      stringValue: obj.data.getString(),
    };
  }
}

module.exports = Value;
