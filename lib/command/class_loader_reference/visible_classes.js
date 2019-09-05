'use strict';

const Base = require('../base');
const checkError = require('../../errors');
const ByteBuffer = require('../../byte_buffer');

class VisibleClasses extends Base {
  get commandSet() {
    return 14;
  }

  get command() {
    return 1;
  }

  encode() {
    return this.allocate(ByteBuffer.getObjectIDSize())
      .putClassLoaderID(this.data)
      .copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    const len = data.getInt();
    const classes = [];
    for (let i = 0; i < len; i++) {
      classes.push({
        refTypeTag: data.getByte(),
        typeID: data.getReferenceTypeID(),
      });
    }
    return { classes };
  }
}

module.exports = VisibleClasses;
