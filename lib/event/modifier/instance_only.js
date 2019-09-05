'use strict';

const ByteBuffer = require('../../byte_buffer');

class InstanceOnly {
  constructor(instance) {
    this.instance = instance;
  }

  get modKind() {
    return 11;
  }

  get size() {
    return 1 + ByteBuffer.getObjectIDSize();
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putObjectID(this.instance.ref);
  }
}

module.exports = InstanceOnly;
