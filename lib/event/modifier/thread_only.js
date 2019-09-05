'use strict';

const ByteBuffer = require('../../byte_buffer');

class ThreadOnly {
  constructor(thread) {
    this.thread = thread;
  }

  get modKind() {
    return 3;
  }

  get size() {
    return 1 + ByteBuffer.getObjectIDSize();
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putThreadID(this.thread.ref);
  }
}

module.exports = ThreadOnly;
