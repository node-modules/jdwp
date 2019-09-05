'use strict';

const { Transform } = require('stream');

class JDWPEncoder extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _encode(packet) {
    if (Buffer.isBuffer(packet)) return packet;

    const data = packet.encode();
    const length = data ? data.length : 0;
    const buf = Buffer.alloc(11 + length, 0);
    buf.writeInt32BE(11 + length);
    buf.writeInt32BE(packet.id, 4);
    buf[9] = packet.commandSet;
    buf[10] = packet.command;

    if (length > 0) {
      data.copy(buf, 11, 0, length);
    }
    return buf;
  }

  _transform(input, encoding, callback) {
    try {
      callback(null, this._encode(input));
    } catch (err) {
      err.input = input;
      callback(err);
    }
  }
}

module.exports = JDWPEncoder;
