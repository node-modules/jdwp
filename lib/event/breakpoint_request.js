'use strict';

const Modifier = require('./modifier');
const EventKind = require('../command/const/event_kind');
const ClassVisibleEventRequest = require('./class_visible_event_request');

class BreakpointRequest extends ClassVisibleEventRequest {
  constructor(vm, location) {
    super(vm);
    this.location = location;
    this.filters.push(new Modifier.LocationOnly(location));
  }

  get eventCmd() {
    return EventKind.BREAKPOINT;
  }
}

module.exports = BreakpointRequest;
