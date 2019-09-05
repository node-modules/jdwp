'use strict';

const assert = require('assert');
const JNITypeParser = require('./jni_type_parser');

class Type {
  constructor(vm) {
    this.vm = vm;
    this.myName = null;
  }

  get name() {
    assert(this.signature);
    if (!this.myName) {
      const parser = new JNITypeParser(this.signature);
      this.myName = parser.typeName;
    }
    return this.myName;
  }

  async getSignature() {
    throw new Error('not implement');
  }

  async getName() {
    await this.getSignature();
    return this.name;
  }
}

module.exports = Type;
