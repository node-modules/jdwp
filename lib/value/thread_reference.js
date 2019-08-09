'use strict';

const {
  SuspendCount,
  Resume,
  Suspend,
  Frames,
  Name,
  Status,
  FrameCount,
  Stop,
  Interrupt,
  ForceEarlyReturn,
  ThreadGroup,
} = require('../command').ThreadReference;
const Value = require('../value');
const StackFrame = require('../stack_frame');
const ObjectReference = require('./object_reference');
const LocalCache = require('../local_cache');

class ThreadReference extends ObjectReference {
  constructor(vm, ref) {
    super(vm, ref);

    this.suspendedZombieCount = 0;
    this.name = null;
    this.threadGroup = null;
  }

  get typeValueKey() {
    return 116;
  }

  get snapshot() {
    return LocalCache.get(this.ref);
  }

  set snapshot(val) {
    LocalCache.set(this.ref, val);
  }

  async suspendCount() {
    if (this.suspendedZombieCount) {
      return this.suspendedZombieCount;
    }

    const { suspendCount } = await this.vm.send(new SuspendCount(this.ref));
    return suspendCount;
  }

  async resume() {
    if (this.suspendedZombieCount) {
      this.suspendedZombieCount--;
      return;
    }
    LocalCache.reset();
    await this.vm.send(new Resume(this.ref));
  }

  async frames() {
    return await this._getFrames(0, -1);
  }

  async frame(index) {
    const list = await this._getFrames(index, 1);
    return list[0];
  }

  async frameCount() {
    if (!this.snapshot || this.snapshot.frameCount === -1) {
      const { frameCount } = await this.vm.send(new FrameCount(this.ref));
      if (!this.snapshot) {
        this.snapshot = {
          frames: [],
          framesStart: 0,
          framesLength: -1,
          frameCount: -1,
        };
      }
      this.snapshot.frameCount = frameCount;
    }
    return this.snapshot.frameCount;
  }

  _isSubrange(start, length) {
    const { snapshot } = this;
    if (!snapshot) return false;
    if (start < snapshot.framesStart) return false;
    if (length === -1) return snapshot.framesLength === -1;

    if (snapshot.framesLength === -1) {
      if ((start + length) > (snapshot.framesStart + snapshot.frames.length)) {
        throw new Error('index out of bounds');
      }
      return true;
    }
    return ((start + length) <= (snapshot.framesStart + snapshot.framesLength));
  }

  async _getFrames(start, length) {
    if (!this.snapshot || !this._isSubrange(start, length)) {
      const result = await this.vm.send(new Frames({
        thread: this.ref,
        startFrame: start,
        length,
      }));
      const frames = result.frames.map(frame => {
        if (!frame.location) throw new Error('Invalid frame location');
        const stackFrame = new StackFrame(this.vm, this, frame.frameID, frame.location);
        return stackFrame;
      });
      this.snapshot = {
        frames,
        framesStart: start,
        framesLength: length,
        frameCount: -1,
      };
    }
    return this.snapshot.frames;
  }

  async getName() {
    if (!this.name) {
      const { threadName } = await this.vm.send(new Name(this.ref));
      this.name = threadName;
    }
    return this.name;
  }

  async suspend() {
    await this.vm.send(new Suspend(this.ref));
  }

  async getStatus() {
    return await this.vm.send(new Status(this.ref));
  }

  async stop(throwable) {
    const list = await this.vm.classesByName('java.lang.Throwable');
    const throwableClass = list[0];
    if (!throwable || !(await throwableClass.isAssignableFrom(throwable))) {
      throw new Error('Not an instance of Throwable');
    }
    await this.vm.send(new Stop({
      thread: this.ref,
      throwable: throwable.ref,
    }));
  }

  async interrupt() {
    await this.vm.send(new Interrupt(this.ref));
  }

  async forceEarlyReturn(returnValue) {
    if (!this.vm.canForceEarlyReturn) {
      throw new Error('target does not support the forcing of a method to return early');
    }
    const sf = await this.frame(0);
    sf.validateStackFrame();
    const method = await sf.location.getMethod();

    const convertedValue = await Value.prepareForAssignment(returnValue, {
      signature: method.returnSignature,
      typeName: method.returnTypeName,
      type: await method.returnType(),
    });

    await this.vm.send(new ForceEarlyReturn({
      thread: this.ref,
      value: convertedValue,
    }));
  }

  async getThreadGroup() {
    if (!this.threadGroup) {
      const { group } = await this.vm.send(new ThreadGroup(this.ref));
      this.threadGroup = this.vm.objectMirror(group, 103);
    }
    return this.threadGroup;
  }
}

module.exports = ThreadReference;
