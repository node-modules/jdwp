'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class GetValues extends Base {
  get commandSet() {
    return 13;
  }

  get command() {
    return 2;
  }

  encode() {
    const { arrayObject, firstIndex, length } = this.data;
    return this.allocate(ByteBuffer.getObjectIDSize() + 8)
      .putObjectID(arrayObject)
      .putInt(firstIndex)
      .putInt(length)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    return data.getArrayRegion();
  }
}

module.exports = GetValues;
