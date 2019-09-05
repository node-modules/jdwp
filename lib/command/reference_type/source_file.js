'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class SourceFile extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 7;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      sourceFile: obj.data.getString(),
    };
  }
}

module.exports = SourceFile;
