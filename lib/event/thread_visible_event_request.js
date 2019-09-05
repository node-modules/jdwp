'use strict';

const Modifier = require('./modifier');
const EventRequest = require('./event_request');

class ThreadVisibleEventRequest extends EventRequest {
  addThreadFilter(thread) {
    this.validateMirror(thread);
    if (this.isEnabled || this.deleted) throw new Error('invalid state');

    this.filters.push(new Modifier.ThreadOnly(thread));
  }
}

module.exports = ThreadVisibleEventRequest;
