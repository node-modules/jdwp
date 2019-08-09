'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class SourceDebugExtension extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 12;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      extension: obj.data.getString(),
    };
  }
}

module.exports = SourceDebugExtension;
