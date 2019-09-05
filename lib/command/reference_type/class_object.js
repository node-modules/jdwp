'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ClassObject extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 11;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      classObject: obj.data.getClassObjectID(),
    };
  }
}

module.exports = ClassObject;
