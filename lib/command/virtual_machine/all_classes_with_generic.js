'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class AllClassesWithGeneric extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 20;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    const classCount = obj.data.getInt();
    const classes = [];
    for (let i = 0; i < classCount; i++) {
      classes.push({
        refTypeTag: obj.data.getByte(),
        typeID: obj.data.getReferenceTypeID(),
        signature: obj.data.getString(),
        genericSignature: obj.data.getString(),
        status: obj.data.getInt(),
      });
    }
    return { classes };
  }
}

module.exports = AllClassesWithGeneric;
