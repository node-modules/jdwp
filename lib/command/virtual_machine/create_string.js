'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class CreateString extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 11;
  }

  encode() {
    return this.allocate(Buffer.byteLength(this.data) + 4)
      .putString(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      stringObject: obj.data.getObjectID(),
    };
  }
}

module.exports = CreateString;
