'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class SetValues extends Base {
  get commandSet() {
    return 3;
  }

  get command() {
    return 2;
  }

  encode() {
    const { clazz, values } = this.data;
    const bb = this.allocate(128)
      .putClassID(clazz)
      .putInt(values.length);

    for (const val of values) {
      bb.putFieldID(val.fieldID);
      bb.putUntaggedValue(val.value);
    }
    return bb.copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = SetValues;
