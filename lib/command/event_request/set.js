'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SetCommand extends Base {
  get commandSet() {
    return 15;
  }

  get command() {
    return 1;
  }

  encode() {
    let len = 1 + 1 + 4; // eventKind + suspendPolicy + modifiers
    for (const mod of this.data.mods) {
      len += mod.size;
    }
    const bb = this.allocate(len)
      .putByte(this.data.eventKind)
      .putByte(this.data.suspendPolicy)
      .putInt(this.data.mods.length);

    for (const mod of this.data.mods) {
      mod.encode(bb);
    }
    return bb.copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      requestID: obj.data.getInt(),
    };
  }
}

module.exports = SetCommand;
