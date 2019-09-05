'use strict';

const BreakpointRequest = require('./event/breakpoint_request');
const ClassUnloadRequest = require('./event/class_unload_request');
const ClassPrepareRequest = require('./event/class_prepare_request');
const MethodEntryRequest = require('./event/method_entry_request');
const StepRequest = require('./event/step_request');
const { ClearAllBreakpoints } = require('./command').EventRequest;


class EventRequestManager {
  constructor(vm) {
    this.vm = vm;
  }

  createBreakpointRequest(location) {
    return new BreakpointRequest(this.vm, location);
  }

  createClassPrepareRequest() {
    return new ClassPrepareRequest(this.vm);
  }

  createClassUnloadRequest() {
    return new ClassUnloadRequest(this.vm);
  }

  createStepRequest(thread, size, depth) {
    return new StepRequest(this.vm, thread, size, depth);
  }

  createMethodEntryRequest() {
    return new MethodEntryRequest(this.vm);
  }

  async deleteAllBreakpoints() {
    await this.vm.send(new ClearAllBreakpoints());
  }
}

module.exports = EventRequestManager;
