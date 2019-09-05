'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class RedefineClasses extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 18;
  }

  encode() {
    const bb = this.allocate(1024);
    const classToBytes = this.data;
    bb.putInt(classToBytes.size);

    for (const entry of classToBytes.entries()) {
      const { key, value } = entry;
      bb.putReferenceTypeID(key.ref);
      bb.putInt(value.length);
      bb.put(value);
    }
    return bb.copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    return;
  }
}

module.exports = RedefineClasses;
