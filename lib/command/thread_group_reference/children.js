'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Children extends Base {
  get commandSet() {
    return 12;
  }

  get command() {
    return 3;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putThreadGroupID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    let size = data.getInt();
    const childThreads = [];
    for (let i = 0; i < size; i++) {
      childThreads.push(data.getThreadID());
    }
    size = data.getInt();
    const childGroups = [];
    for (let i = 0; i < size; i++) {
      childGroups.push(data.getThreadGroupID());
    }
    return { childThreads, childGroups };
  }
}

module.exports = Children;
