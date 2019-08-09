'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SetValues extends Base {
  get commandSet() {
    return 16;
  }

  get command() {
    return 2;
  }

  encode() {
    const { thread, frame, slotValues } = this.data;
    const slotSize = slotValues.length;
    const bb = this.allocate(128)
      .putThreadID(thread)
      .putFrameID(frame)
      .putInt(slotSize);

    for (const item of slotValues) {
      bb.putInt(item.slot);
      bb.putValue(item.slotValue);
    }
    return bb.copy();
  }

  decode(obj) {
    const { errorCode } = obj;
    checkError(errorCode);
    return null;
  }
}

module.exports = SetValues;
