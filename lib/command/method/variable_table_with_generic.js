'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class VariableTableWithGeneric extends Base {
  get commandSet() {
    return 6;
  }

  get command() {
    return 5;
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
    const argCnt = data.getInt();
    const len = data.getInt();
    const slots = [];
    for (let i = 0; i < len; i++) {
      slots.push({
        codeIndex: data.getLong().toInt(),
        name: data.getString(),
        signature: data.getString(),
        genericSignature: data.getString(),
        length: data.getInt(),
        slot: data.getInt(),
      });
    }
    return { argCnt, slots };
  }
}

module.exports = VariableTableWithGeneric;
