'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class ReferringObjects extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 10;
  }

  encode() {
    const { object, maxReferrers } = this.data;
    return this.allocate(ByteBuffer.getObjectIDSize() + 4)
      .putObjectID(object)
      .putInt(maxReferrers)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const referringObjects = [];
    const size = data.getInt();
    for (let i = 0; i < size; i++) {
      referringObjects.push(data.getTaggedObjectID());
    }
    return { referringObjects };
  }
}

module.exports = ReferringObjects;
