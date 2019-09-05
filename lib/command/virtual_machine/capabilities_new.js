'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class CapabilitiesNew extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 17;
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
      canRedefineClasses: data.getBoolean(),
      canAddMethod: data.getBoolean(),
      canUnrestrictedlyRedefineClasses: data.getBoolean(),
      canPopFrames: data.getBoolean(),
      canUseInstanceFilters: data.getBoolean(),
      canGetSourceDebugExtension: data.getBoolean(),
      canRequestVMDeathEvent: data.getBoolean(),
      canSetDefaultStratum: data.getBoolean(),
      canGetInstanceInfo: data.getBoolean(),
      canRequestMonitorEvents: data.getBoolean(),
      canGetMonitorFrameInfo: data.getBoolean(),
      canUseSourceNameFilters: data.getBoolean(),
      canGetConstantPool: data.getBoolean(),
      canForceEarlyReturn: data.getBoolean(),
      // reserved 22 ~ 32
    };
  }
}

module.exports = CapabilitiesNew;
