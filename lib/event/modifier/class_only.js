'use strict';

const ByteBuffer = require('../../byte_buffer');

class ClassOnly {
  constructor(clazz) {
    this.clazz = clazz;
  }

  get modKind() {
    return 4;
  }

  get size() {
    return 1 + ByteBuffer.getReferenceTypeIDSize();
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putReferenceTypeID(this.clazz.ref);
  }
}

module.exports = ClassOnly;
