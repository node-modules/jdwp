'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class GetValues extends Base {
  get commandSet() {
    return 16;
  }

  get command() {
    return 1;
  }

  encode() {
    const { thread, frame, slots } = this.data;
    const slotSize = slots.length;
    const len = ByteBuffer.getObjectIDSize() + ByteBuffer.getFrameIDSize() + 4 + slotSize * 5;
    const bb = this.allocate(len)
      .putThreadID(thread)
      .putFrameID(frame)
      .putInt(slotSize);

    for (const slot of slots) {
      bb.putInt(slot.slot);
      bb.putByte(slot.sigbyte);
    }
    return bb.copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const len = data.getInt();
    const values = [];
    for (let i = 0; i < len; i++) {
      values.push(data.getValue());
    }
    return { values };
  }
}

module.exports = GetValues;
