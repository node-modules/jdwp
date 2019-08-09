'use strict';

const Modifier = require('./modifier');
const ThreadVisibleEventRequest = require('./thread_visible_event_request');

class ClassVisibleEventRequest extends ThreadVisibleEventRequest {
  addClassFilter(val) {
    if (this.isEnabled || this.deleted) throw new Error('invalid state');

    if (typeof val === 'string') {
      this.filters.push(new Modifier.ClassMatch(val));
    } else {
      this.validateMirror(val);
      this.filters.push(new Modifier.ClassOnly(val));
    }
  }

  addClassExclusionFilter(classPattern) {
    if (this.isEnabled || this.deleted) throw new Error('invalid state');
    if (!classPattern) throw new Error('classPattern is required');

    this.filters.push(new Modifier.ClassExclude(classPattern));
  }

  addInstanceFilter(instance) {
    this.validateMirror(instance);
    if (this.isEnabled || this.deleted) throw new Error('invalid state');
    if (!this.vm.canUseInstanceFilters) throw new Error('target does not support instance filters');

    this.filters.push(new Modifier.InstanceOnly(instance));
  }
}

module.exports = ClassVisibleEventRequest;
