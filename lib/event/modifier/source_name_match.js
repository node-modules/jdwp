'use strict';

class SourceNameMatch {
  constructor(sourceNamePattern) {
    this.sourceNamePattern = sourceNamePattern;
  }

  get modKind() {
    return 12;
  }

  get size() {
    return 5 + Buffer.byteLength(this.sourceNamePattern);
  }

  encode(bb) {
    bb.putByte(this.modKind);
    bb.putString(this.sourceNamePattern);
  }
}

module.exports = SourceNameMatch;
