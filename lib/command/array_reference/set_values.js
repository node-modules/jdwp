'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SetValues extends Base {
  get commandSet() {
    return 13;
  }

  get command() {
    return 3;
  }

  encode() {
    const { arrayObject, firstIndex, values } = this.data;
    const bb = this.allocate(128)
      .putObjectID(arrayObject)
      .putInt(firstIndex)
      .putInt(values.length);
    for (const v of values) {
      bb.putUntaggedValue(v);
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
