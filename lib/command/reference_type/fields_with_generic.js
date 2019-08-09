'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class FieldsWithGeneric extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 14;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    const count = obj.data.getInt();
    const declared = [];
    for (let i = 0; i < count; i++) {
      declared.push({
        fieldID: obj.data.getFieldID(),
        name: obj.data.getString(),
        signature: obj.data.getString(),
        genericSignature: obj.data.getString(),
        modBits: obj.data.getInt(),
      });
    }
    return { declared };
  }
}

module.exports = FieldsWithGeneric;
