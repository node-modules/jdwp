'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Fields extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 4;
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
        modBits: obj.data.getInt(),
      });
    }
    return { declared };
  }
}

module.exports = Fields;
