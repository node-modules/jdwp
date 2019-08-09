'use strict';

const JDWP = require('../command');
const Modifier = require('./modifier');
const { EventEmitter } = require('events');
const SuspendPolicy = require('../command/const/suspend_policy');

class EventRequest extends EventEmitter {
  constructor(vm) {
    super();
    this.vm = vm;
    this.isEnabled = false;
    this.deleted = false;
    this.suspendPolicy = SuspendPolicy.ALL;
    this.filters = [];
    this.id = null;

    // TODO:
    this.eventHandler = ({ events }) => {
      let trigger = false;
      for (const event of events) {
        if (event.requestID === this.id) {
          trigger = true;
          this.emit('event', event);
        }
      }
      if (trigger) {
        this.vm.removeListener('event', this.eventHandler);
      }
    };
    this.vm.on('event', this.eventHandler);
  }

  get eventCmd() {
    throw new Error('not implement');
  }

  async enable() {
    await this._setEnabled(true);
  }

  async disable() {
    await this._setEnabled(false);
    this.vm.removeListener('event', this.eventHandler);
  }

  async delete() {
    if (!this.deleted) {
      await this.disable();
      this.deleted = true;
    }
  }

  async _setEnabled(val) {
    if (this.deleted) throw new Error('invalid state, already deleted');
    if (val === this.isEnabled) return;

    if (this.isEnabled) {
      await this.clear();
    } else {
      await this.set();
    }
  }

  addCountFilter(count) {
    if (this.isEnabled || this.deleted) throw new Error('invalid state');

    if (count < 1) {
      throw new Error('count is less than one');
    }
    this.filters.push(new Modifier.Count(count));
  }

  async set() {
    const { requestID } = await this.vm.send(new JDWP.EventRequest.Set({
      eventKind: this.eventCmd,
      suspendPolicy: this.suspendPolicy,
      mods: this.filters,
    }));
    this.id = requestID;
    this.isEnabled = true;
  }

  async clear() {
    await this.vm.send(new JDWP.EventRequest.Clear({
      eventKind: this.eventCmd,
      id: this.id,
    }));
    this.isEnabled = false;
  }

  validateMirror(mirror) {
    if (this.vm !== mirror.vm) throw new Error('vm mismatch');
  }
}

module.exports = EventRequest;
