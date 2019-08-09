'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class HoldEvents extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 15;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = HoldEvents;
