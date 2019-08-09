'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class ThreadGroup extends Base {
  get commandSet() {
    return 11;
  }

  get command() {
    return 5;
  }

  encode() {
    return this.allocate(8)
      .putThreadID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      group: obj.data.getObjectID(),
    };
  }
}

module.exports = ThreadGroup;
