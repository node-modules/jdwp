'use strict';

const EventKind = require('../command/const/event_kind');
const ClassVisibleEventRequest = require('./class_visible_event_request');

class ClassUnloadRequest extends ClassVisibleEventRequest {
  get eventCmd() {
    return EventKind.CLASS_UNLOAD;
  }
}

module.exports = ClassUnloadRequest;
