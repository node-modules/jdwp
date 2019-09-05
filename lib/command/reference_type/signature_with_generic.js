'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class SignatureWithGeneric extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 13;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      signature: obj.data.getString(),
      genericSignature: obj.data.getString(),
    };
  }
}

module.exports = SignatureWithGeneric;
