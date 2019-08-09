'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class GetValues extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 2;
  }

  encode() {
    const { object, fields } = this.data;
    const size = fields.length;
    const bb = this.allocate(ByteBuffer.getObjectIDSize() + 4 + size * ByteBuffer.getFieldIDSize())
      .putObjectID(object)
      .putInt(size);
    for (const field of fields) {
      bb.putFieldID(field);
    }
    return bb.copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const values = [];
    const size = data.getInt();
    for (let i = 0; i < size; i++) {
      values.push(data.getValue());
    }
    return { values };
  }
}

module.exports = GetValues;
