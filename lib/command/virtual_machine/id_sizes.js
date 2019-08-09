'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class IDSizes extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 7;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      fieldIDSize: obj.data.getInt(),
      methodIDSize: obj.data.getInt(),
      objectIDSize: obj.data.getInt(),
      referenceTypeIDSize: obj.data.getInt(),
      frameIDSize: obj.data.getInt(),
    };
  }
}

module.exports = IDSizes;
