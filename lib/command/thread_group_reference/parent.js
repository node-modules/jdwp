'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Parent extends Base {
  get commandSet() {
    return 12;
  }

  get command() {
    return 2;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putThreadGroupID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      parentGroup: obj.data.getObjectID(),
    };
  }
}

module.exports = Parent;
