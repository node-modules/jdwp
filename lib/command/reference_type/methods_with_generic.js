'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class MethodsWithGeneric extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 15;
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
        methodID: obj.data.getMethodID(),
        name: obj.data.getString(),
        signature: obj.data.getString(),
        genericSignature: obj.data.getString(),
        modBits: obj.data.getInt(),
      });
    }
    return { declared };
  }
}

module.exports = MethodsWithGeneric;
