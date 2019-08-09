'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SetDefaultStratum extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 19;
  }

  encode() {
    const stratumID = this.data || '';
    return this.allocate(Buffer.byteLength(stratumID) + 4)
      .putString(stratumID)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = SetDefaultStratum;
