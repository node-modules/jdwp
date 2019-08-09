'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class MonitorInfo extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 5;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putObjectID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const owner = data.getThreadID();
    const entryCount = data.getInt();
    const size = data.getInt();
    const waiters = [];
    for (let i = 0; i < size; i++) {
      waiters.push(data.getThreadID());
    }
    return { owner, entryCount, waiters };
  }
}

module.exports = MonitorInfo;
