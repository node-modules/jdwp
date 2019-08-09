'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class ClassesBySignature extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 2;
  }

  encode() {
    return this.allocate(Buffer.byteLength(this.data) + 4)
      .putString(this.data)
      .copy();
  }

  decode(obj) {
    checkError(obj.errorCode);
    const count = obj.data.getInt();
    const classes = [];
    for (let i = 0; i < count; i++) {
      classes.push({
        refTypeTag: obj.data.getByte(),
        typeID: obj.data.getReferenceTypeID(),
        status: obj.data.getInt(),
      });
    }
    return classes;
  }
}

module.exports = ClassesBySignature;
