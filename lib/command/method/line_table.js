'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class LineTable extends Base {
  get commandSet() {
    return 6;
  }

  get command() {
    return 1;
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
    const start = data.getLong().toInt();
    const end = data.getLong().toInt();
    const len = data.getInt();
    const lines = [];
    for (let i = 0; i < len; i++) {
      lines.push({
        lineCodeIndex: data.getLong().toInt(),
        lineNumber: data.getInt(),
      });
    }
    return {
      start,
      end,
      lines,
    };
  }
}

module.exports = LineTable;
