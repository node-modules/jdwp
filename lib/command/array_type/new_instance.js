'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class NewInstance extends Base {
  get commandSet() {
    return 4;
  }

  get command() {
    return 1;
  }

  encode() {
    const { arrType, length } = this.data;
    return this.allocate(ByteBuffer.getReferenceTypeIDSize() + 4)
      .putReferenceTypeID(arrType)
      .putInt(length)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    return {
      newArray: data.getTaggedObjectID(),
    };
  }
}

module.exports = NewInstance;
