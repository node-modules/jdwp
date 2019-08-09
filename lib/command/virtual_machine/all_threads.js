'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class AllThreads extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 4;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    const count = obj.data.getInt();
    const threads = [];
    for (let i = 0; i < count; i++) {
      threads.push(obj.data.getThreadID());
    }
    return threads;
  }
}

module.exports = AllThreads;
