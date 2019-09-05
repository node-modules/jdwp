'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class IsObsolete extends Base {
  get commandSet() {
    return 6;
  }

  get command() {
    return 4;
  }

  encode() {
    const { refType, methodID } = this.data;
    return this.allocate(ByteBuffer.getReferenceTypeIDSize() + ByteBuffer.getMethodIDSize())
      .putReferenceTypeID(refType)
      .putMethodID(methodID)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const isObsolete = data.getBoolean();
    return { isObsolete };
  }
}

module.exports = IsObsolete;
