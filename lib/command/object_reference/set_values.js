'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SetValues extends Base {
  get commandSet() {
    return 9;
  }

  get command() {
    return 3;
  }

  encode() {
    const { object, values } = this.data;
    const size = values.length;
    const bb = this.allocate(128)
      .putObjectID(object)
      .putInt(size);
    for (const item of values) {
      bb.putFieldID(item.fieldID);
      bb.putUntaggedValue(item.value);
    }
    return bb.copy();
  }

  decode(obj) {
    const { errorCode } = obj;
    checkError(errorCode);
    return;
  }
}

module.exports = SetValues;
