'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SuspendCount extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 12;
  }

  encode() {
    return this.allocate(8)
      .putThreadID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      suspendCount: obj.data.getInt(),
    };
  }
}

module.exports = SuspendCount;
