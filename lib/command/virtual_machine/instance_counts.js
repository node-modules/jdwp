'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class InstanceCounts extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 21;
  }

  encode() {
    const classes = this.data || [];
    const size = classes.length;
    const bb = this.allocate(ByteBuffer.getReferenceTypeIDSize() * size + 4)
      .putInt(size);

    for (const type of classes) {
      bb.putReferenceTypeID(type.ref);
    }
    return bb.copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const len = data.getInt();
    const counts = [];
    for (let i = 0; i < len; i++) {
      counts.push(data.getLong().toInt());
    }
    return { counts };
  }
}

module.exports = InstanceCounts;
