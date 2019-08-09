'use strict';

const assert = require('assert');
const { Writable } = require('stream');
const ByteBuffer = require('./byte_buffer');

class JDWPDecoder extends Writable {
  constructor(options = {}) {
    super(options);
    this._buf = null;
    this._handshaked = false;
  }

  _write(chunk, encoding, callback) {
    // 合并 buf 中的数据
    this._buf = this._buf ? Buffer.concat([ this._buf, chunk ]) : chunk;
    try {
      let unfinish = false;
      do {
        unfinish = this._decode();
      } while (unfinish);
      callback();
    } catch (err) {
      err.name = 'JDWPDecodeError';
      err.data = this._buf ? this._buf.toString('base64') : '';
      callback(err);
    }
  }

  _decode() {
    const bufLength = this._buf.length;
    if (bufLength < 11) {
      return false;
    }

    let packetLength;
    if (!this._handshaked) {
      if (bufLength < 14) {
        return false;
      }
      packetLength = 14;
      const handshake = this._buf.slice(0, 14).toString();
      assert(handshake === 'JDWP-Handshake', 'missing handshake bytes');
      this._handshaked = true;
      this.emit('handshake');
    } else {
      packetLength = this._buf.readInt32BE(0);
      if (packetLength > bufLength) {
        return false;
      }
      const packet = {
        id: this._buf.readInt32BE(4),
        flags: this._buf[8],
        data: ByteBuffer.wrap(this._buf, 11, packetLength - 11),
      };
      if (packet.flags === 0x80) {
        packet.errorCode = this._buf.readInt16BE(9);
      } else {
        packet.commandSet = this._buf[9];
        packet.command = this._buf[10];
      }
      this.emit('packet', packet);
    }
    const restLen = bufLength - packetLength;
    if (restLen) {
      this._buf = this._buf.slice(packetLength);
      return true;
    }
    this._buf = null;
    return false;
  }

  _destroy() {
    this._buf = null;
    this.emit('close');
  }
}

module.exports = JDWPDecoder;
