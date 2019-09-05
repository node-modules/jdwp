'use strict';

const {
  Name,
  Parent,
  Children,
} = require('../command').ThreadGroupReference;
const ObjectReference = require('./object_reference');
const LocalCache = require('../local_cache');

class ThreadGroupReference extends ObjectReference {
  constructor(vm, ref) {
    super(vm, ref);
    this.name = null;
    this.parent = null;
    this.triedParent = false;
  }

  get typeValueKey() { return 103; }

  get snapshot() {
    return LocalCache.get(this.ref);
  }

  set snapshot(val) {
    LocalCache.set(this.ref, val);
  }

  async getName() {
    if (!this.name) {
      const { groupName } = await this.vm.send(new Name(this.ref));
      this.name = groupName;
    }
    return this.name;
  }

  async getParent() {
    if (!this.triedParent) {
      const { parentGroup } = await this.vm.send(new Parent(this.ref));
      this.parent = this.vm.objectMirror(parentGroup, 103);
      this.triedParent = true;
    }
    return this.parent;
  }

  async kids() {
    let kids = null;
    if (this.snapshot) {
      kids = this.snapshot.kids;
    }
    if (!kids) {
      const result = await this.vm.send(new Children(this.ref));
      kids = {
        childThreads: result.childThreads.map(t => this.vm.objectMirror(t, 116)),
        childGroups: result.childGroups.map(g => this.vm.objectMirror(g, 103)),
      };
      if (!this.snapshot) {
        this.snapshot = {};
      }
      this.snapshot.kids = kids;
    }
    return kids;
  }

  async threads() {
    const { childThreads } = await this.kids();
    return childThreads;
  }

  async threadGroups() {
    const { childGroups } = await this.kids();
    return childGroups;
  }

  async suspend() {
    const threads = await this.threads();
    for (const thread of threads) {
      await thread.suspend();
    }
    const threadGroups = await this.threadGroups();
    for (const threadGroup of threadGroups) {
      await threadGroup.suspend();
    }
  }

  async resume() {
    const threads = await this.threads();
    for (const thread of threads) {
      await thread.resume();
    }
    const threadGroups = await this.threadGroups();
    for (const threadGroup of threadGroups) {
      await threadGroup.resume();
    }
  }
}

module.exports = ThreadGroupReference;
