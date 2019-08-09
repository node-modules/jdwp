'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ReferenceType extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putObjectID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    return {
      refTypeTag: data.getByte(),
      typeID: data.getReferenceTypeID(),
    };
  }
}

module.exports = ReferenceType;
