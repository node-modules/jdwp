'use strict';

const ByteBuffer = require('../../byte_buffer');

class Step {
  constructor(thread, size, depth) {
    this.thread = thread;
    this.jSize = size;
    this.depth = depth;
  }

  get modKind() {
    return 10;
  }

  get size() {
    return 9 + ByteBuffer.getObjectIDSize();
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putThreadID(this.thread.ref);
    bb.putInt(this.jSize);
    bb.putInt(this.depth);
  }
}

module.exports = Step;
