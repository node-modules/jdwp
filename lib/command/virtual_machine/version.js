'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class Version extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 1;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    return {
      description: obj.data.getString(),
      jdwpMajor: obj.data.getInt(),
      jdwpMinor: obj.data.getInt(),
      vmVersion: obj.data.getString(),
      vmName: obj.data.getString(),
    };
  }
}

module.exports = Version;
