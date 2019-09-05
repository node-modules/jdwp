'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class Clear extends Base {
  get commandSet() {
    return 15;
  }

  get command() {
    return 2;
  }

  encode() {
    return this.allocate(5)
      .putByte(this.data.eventKind)
      .putInt(this.data.id)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return null;
  }
}

module.exports = Clear;
