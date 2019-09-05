'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ClassFileVersion extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 17;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      majorVersion: obj.data.getInt(),
      minorVersion: obj.data.getInt(),
    };
  }
}

module.exports = ClassFileVersion;
