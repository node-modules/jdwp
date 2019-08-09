'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class Suspend extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 8;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = Suspend;
