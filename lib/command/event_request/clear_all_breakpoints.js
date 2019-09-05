'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class ClearAllBreakpoints extends Base {
  get commandSet() {
    return 15;
  }

  get command() {
    return 3;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    return null;
  }
}

module.exports = ClearAllBreakpoints;
