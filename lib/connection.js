'use strict';

const pump = require('pump');
const Base = require('sdk-base');
const assert = require('assert');
const JDWPEncoder = require('./encoder');
const JDWPDecoder = require('./decoder');
const { Composite } = require('./command').Event;

const defaultOptions = {
  noDelay: true,
  connectTimeout: 3000,
  logger: console,
};

class JDWPConnection extends Base {
  constructor(options = {}) {
    assert(options.socket, 'options.socket is required');
    super({
      ...options,
      ...defaultOptions,
    });
    this.socket.setNoDelay(this.options.noDelay);
    this.socket.resume();
    this._encoder = new JDWPEncoder();
    this._decoder = new JDWPDecoder();
    this._closed = false;
    this._userClosed = false;
    this._sentReqs = new Map();

    this._decoder.on('packet', packet => {
      this._handlePacket(packet);
    });

    pump(this._encoder, this.socket, this._decoder, err => {
      this._handleClose(err);
    });
    this._encoder.write(Buffer.from('JDWP-Handshake'));
    this.ready(true);
  }

  get logger() {
    return this.options.logger;
  }

  get socket() {
    return this.options.socket;
  }

  async send(packet, timeout = 3000) {
    this._encoder.write(packet);
    return await this._waitReply(packet, timeout);
  }

  _waitReply(packet, timeout) {
    const id = packet.id;
    const start = Date.now();
    let resolveCallback;
    let rejectCallback;
    const promise = new Promise((resolve, reject) => {
      resolveCallback = resolve;
      rejectCallback = reject;
    });
    const timer = setTimeout(() => {
      const rt = Date.now() - start;
      const err = new Error('no response in ' + rt + 'ms');
      err.packet = packet;
      err.timeout = timeout;
      err.name = 'ResponseTimeoutError';
      this._handleRequestError(id, err);
    }, timeout);
    this._sentReqs.set(id, { packet, timer, promise, resolveCallback, rejectCallback });
    return promise;
  }

  _cleanReq(id) {
    const { timer } = this._sentReqs.get(id);
    clearTimeout(timer);
    return this._sentReqs.delete(id);
  }

  _handleRequestError(id, err) {
    if (!this._sentReqs.has(id)) {
      return;
    }
    const { rejectCallback } = this._sentReqs.get(id);
    this._cleanReq(id);
    return rejectCallback(err);
  }

  _handlePacket(packet) {
    const { id, flags } = packet;
    // reply
    if (flags === 0x80) {
      if (!this._sentReqs.has(id)) return;

      const req = this._sentReqs.get(id);
      this._cleanReq(id);
      try {
        req.resolveCallback(req.packet.decode(packet));
      } catch (err) {
        req.rejectCallback(err);
      }
    } else if (packet.commandSet === 64 && packet.command === 100) {
      // TODO: events
      const evt = new Composite(packet.id);
      this.emit('event', evt.decode(packet));
    }
  }

  _cancelAllReqs(err) {
    if (!err) {
      err = new Error('The socket was closed. ');
      err.name = 'SocketCloseError';
    }
    for (const id of this._sentReqs.keys()) {
      this._handleRequestError(id, err);
    }
  }

  _handleClose(err) {
    if (this._closed) return;
    this._closed = true;
    if (err) {
      if (err.code === 'ECONNRESET') {
        this.logger.warn('[JDWPConnection] ECONNRESET');
      } else {
        err.name = err.name === 'Error' ? 'SocketError' : err.name;
        this.emit('error', err);
      }
    }
    this._cancelAllReqs(err);
    this._decoder.destroy();
    this.emit('close');
  }
}

module.exports = JDWPConnection;
