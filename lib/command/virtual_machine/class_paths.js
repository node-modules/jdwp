'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class ClassPaths extends Base {
  get commandSet() {
    return 1;
  }

  get command() {
    return 13;
  }

  encode() {
    return null;
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);

    const baseDir = data.getString();
    let count = data.getInt();
    const classpaths = [];
    for (let i = 0; i < count; i++) {
      classpaths.push(data.getString());
    }
    count = data.getInt();
    const bootclasspaths = [];
    for (let i = 0; i < count; i++) {
      bootclasspaths.push(data.getString());
    }
    return { baseDir, classpaths, bootclasspaths };
  }
}

module.exports = ClassPaths;
