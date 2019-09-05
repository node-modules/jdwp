'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class TopLevelThreadGroups extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 5;
  }

  encode() {
    return null;
  }

  decode(obj) {
    checkError(obj.errorCode);
    const groupCount = obj.data.getInt();
    const groups = [];
    for (let i = 0; i < groupCount; i++) {
      groups.push(obj.data.getObjectID());
    }
    return { groups };
  }
}

module.exports = TopLevelThreadGroups;
