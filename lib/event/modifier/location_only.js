'use strict';

const ByteBuffer = require('../../byte_buffer');

class LocationOnly {
  constructor(location) {
    this.location = location;
  }

  get modKind() {
    return 7;
  }

  get size() {
    return 10 + ByteBuffer.getReferenceTypeIDSize() + ByteBuffer.getMethodIDSize();
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putLocation(this.location);
  }
}

module.exports = LocationOnly;
