'use strict';

class Count {
  constructor(count) {
    this.count = count;
  }

  get modKind() {
    return 1;
  }

  get size() {
    return 5;
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putInt(this.count);
  }
}

module.exports = Count;
