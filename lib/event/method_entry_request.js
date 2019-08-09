'use strict';

const EventKind = require('../command/const/event_kind');
const ClassVisibleEventRequest = require('./class_visible_event_request');

class MethodEntryRequest extends ClassVisibleEventRequest {
  get eventCmd() {
    return EventKind.METHOD_ENTRY;
  }
}

module.exports = MethodEntryRequest;
