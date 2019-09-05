'use strict';

const Base = require('../base');
const checkError = require('../../errors');

class InvokeMethod extends Base {
  get commandSet() {
    return 3;
  }

  get command() {
    return 3;
  }

  encode() {
    const { clazz, thread, methodID, args, options } = this.data;
    const bb = this.allocate(128)
      .putClassID(clazz)
      .putThreadID(thread)
      .putMethodID(methodID)
      .putInt(args.length);
    for (const arg of args) {
      bb.putValue(arg);
    }
    bb.putInt(options);
    return bb.copy();
  }

  decode(obj) {
    const { errorCode, data } = obj;
    checkError(errorCode);
    return {
      returnValue: data.getValue(),
      exception: data.getTaggedObjectID(),
    };
  }
}

module.exports = InvokeMethod;
