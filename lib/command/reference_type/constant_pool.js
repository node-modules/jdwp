'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ConstantPool extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 18;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const count = data.getInt();
    const size = data.getInt();
    return {
      count,
      cpbytes: data.getBytes(size),
    };
  }
}

module.exports = ConstantPool;
