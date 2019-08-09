'use strict';

const utils = require('../utils');
const ByteBuffer = require('../byte_buffer');

class BasePacket {
  constructor(data) {
    this.id = utils.nextId();
    this.data = data;
  }

  get commandSet() {
    throw new Error('not implement');
  }

  get command() {
    throw new Error('not implement');
  }

  allocate(size) {
    return ByteBuffer.allocate(size);
  }

  encode() {
    throw new Error('not implement');
  }

  decode() {
    throw new Error('not implement');
  }
}

module.exports = BasePacket;
