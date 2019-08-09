'use strict';

const Modifier = require('./modifier');
const EventKind = require('../command/const/event_kind');
const ClassVisibleEventRequest = require('./class_visible_event_request');

class ClassPrepareRequest extends ClassVisibleEventRequest {
  get eventCmd() {
    return EventKind.CLASS_PREPARE;
  }

  addSourceNameFilter(sourceNamePattern) {
    if (this.isEnabled || this.deleted) throw new Error('invalid state');

    if (!this.vm.canUseSourceNameFilters) {
      throw new Error('target does not support source name filters');
    }
    if (!sourceNamePattern) {
      throw new Error('sourceNamePattern should not be null');
    }

    this.filters.push(new Modifier.SourceNameMatch(sourceNamePattern));
  }
}

module.exports = ClassPrepareRequest;
