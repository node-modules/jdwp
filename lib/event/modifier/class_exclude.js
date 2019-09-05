'use strict';

class ClassExclude {
  constructor(classPattern) {
    this.classPattern = classPattern;
  }

  get modKind() {
    return 6;
  }

  get size() {
    return 5 + Buffer.byteLength(this.classPattern);
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putString(this.classPattern);
  }
}

module.exports = ClassExclude;
