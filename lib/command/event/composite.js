'use strict';

const Base = require('../base');
const handlers = require('./event_handler');

class Composite extends Base {
  get commandSet() {
    return 64;
  }

  get command() {
    return 100;
  }

  _decodeSingleEvent(data) {
    const eventKind = data.getByte();
    const handler = handlers.get(eventKind);
    if (handler) return handler(data);
    return { eventKind };
  }

  decode(obj) {
    const suspendPolicy = obj.data.getByte();
    const eventCount = obj.data.getInt();
    const events = [];
    for (let i = 0; i < eventCount; i++) {
      events.push(this._decodeSingleEvent(obj.data));
    }
    return {
      suspendPolicy,
      events,
    };
  }
}

module.exports = Composite;
