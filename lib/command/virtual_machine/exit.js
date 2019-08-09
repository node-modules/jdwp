'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class Exit extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 10;
  }

  encode() {
    return this.allocate(4).putInt(this.data || 0).copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = Exit;
