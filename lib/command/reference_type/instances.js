'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class Instances extends Base {
  get commandSet() {
    return 2;
  }

  get command() {
    return 16;
  }

  encode() {
    return this.allocate(ByteBuffer.getReferenceTypeIDSize() + 4)
      .putReferenceTypeID(this.data.refType)
      .putInt(this.data.maxInstances)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const count = obj.data.getInt();
    const instances = [];
    for (let i = 0; i < count; i++) {
      instances.push(data.getTaggedObjectID());
    }
    return { instances };
  }
}

module.exports = Instances;
