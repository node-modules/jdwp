'use strict';

const Modifier = require('./modifier');
const EventKind = require('../command/const/event_kind');
const ClassVisibleEventRequest = require('./class_visible_event_request');

const STEP_MIN = -1;
const STEP_LINE = -2;
const STEP_INTO = 1;
const STEP_OVER = 2;
const STEP_OUT = 3;

class StepRequest extends ClassVisibleEventRequest {
  constructor(vm, thread, size, depth) {
    super(vm);
    this.thread = thread;
    this.size = size;
    this.depth = depth;

    /*
     * Translate size and depth to corresponding JDWP values.
     */
    let jdwpSize;
    switch (size) {
      case STEP_MIN:
        jdwpSize = 0;
        break;
      case STEP_LINE:
        jdwpSize = 1;
        break;
      default:
        throw new Error('Invalid step size');
    }

    let jdwpDepth;
    switch (depth) {
      case STEP_INTO:
        jdwpDepth = 0;
        break;
      case STEP_OVER:
        jdwpDepth = 1;
        break;
      case STEP_OUT:
        jdwpDepth = 2;
        break;
      default:
        throw new Error('Invalid step depth');
    }
    this.filters.push(new Modifier.Step(thread, jdwpSize, jdwpDepth));
  }

  get eventCmd() {
    return EventKind.SINGLE_STEP;
  }
}

module.exports = StepRequest;
