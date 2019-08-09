'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class GetValues extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 6;
  }

  encode() {
    const { fields, refType } = this.data;
    const size = fields.length;
    const bb = this.allocate(ByteBuffer.getReferenceTypeIDSize() + 4 + size * ByteBuffer.getFieldIDSize())
      .putReferenceTypeID(refType)
      .putInt(size);

    for (const field of fields) {
      bb.putFieldID(field);
    }
    return bb.copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    const count = obj.data.getInt();
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push(obj.data.getValue());
    }
    return { values };
  }
}

module.exports = GetValues;
