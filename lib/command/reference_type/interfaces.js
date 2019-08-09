'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Interfaces extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 10;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize())
      .putReferenceTypeID(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    const count = obj.data.getInt();
    const interfaces = [];
    for (let i = 0; i < count; i++) {
      interfaces.push({
        interfaceType: obj.data.getInterfaceID(),
      });
    }
    return { interfaces };
  }
}

module.exports = Interfaces;
