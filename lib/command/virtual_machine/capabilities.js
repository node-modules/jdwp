'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class Capabilities extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 12;
  }

  encode() {
    return null;
  }

  decode(obj) {
    const { data, errorCode } = obj;
    checkError(errorCode);
    return {
      canWatchFieldModification: data.getBoolean(),
      canWatchFieldAccess: data.getBoolean(),
      canGetBytecodes: data.getBoolean(),
      canGetSyntheticAttribute: data.getBoolean(),
      canGetOwnedMonitorInfo: data.getBoolean(),
      canGetCurrentContendedMonitor: data.getBoolean(),
      canGetMonitorInfo: data.getBoolean(),
    };
  }
}

module.exports = Capabilities;
