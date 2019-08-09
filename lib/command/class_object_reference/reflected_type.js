'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ReflectedType extends Base {
  get commandSet() {
    return 17;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putClassObjectID(this.data)
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

module.exports = ReflectedType;
