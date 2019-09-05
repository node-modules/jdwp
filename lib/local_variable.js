'use strict';

class LocalVariable {
  constructor(vm, method, slot, scopeStart, scopeEnd, name, signature, genericSignature) {
    this.vm = vm;
    this.method = method;
    this.slot = slot;
    this.scopeStart = scopeStart;
    this.scopeEnd = scopeEnd;
    this.name = name;
    this.signature = signature;
    this.genericSignature = genericSignature;
  }

  isVisible(frame) {
    const frameMethod = frame.location.method;
    if (!this.method.equals(frameMethod)) {
      throw new Error('frame method different than variable\'s method');
    }
    if (frameMethod.isNative) {
      return false;
    }
    const r = this.scopeStart.codeIndex - frame.location.codeIndex;
    const r2 = this.scopeEnd.codeIndex - frame.location.codeIndex;
    return r <= 0 && r2 >= 0;
  }

  hides(other) {
    if (!this.method.equals(other.method) || this.name !== other.name) return false;
    return (this.scopeStart.codeIndex - other.scopeStart.codeIndex) > 0;
  }
}

module.exports = LocalVariable;
