'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Superclass extends Base {
  get commandSet() {
    return 3;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putClassID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      superclass: obj.data.getClassID(),
    };
  }
}

module.exports = Superclass;
