'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Name extends Base {
  get commandSet() {
    return 12;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putThreadGroupID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      groupName: obj.data.getString(),
    };
  }
}

module.exports = Name;
