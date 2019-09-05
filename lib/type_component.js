'use strict';

const VMModifiers = require('./command/const/vm_modifiers');

class TypeComponent {
  constructor(vm, declaringType, ref, name, signature, genericSignature, modifiers) {
    this.vm = vm;
    this.declaringType = declaringType;
    this.ref = ref;
    this.name = name;
    this.signature = signature;
    this.genericSignature = genericSignature;
    this.modifiers = modifiers;
  }

  equals(field) {
    if (!field) return false;
    return this.vm === field.vm;
  }

  get isStatic() {
    return this.isModifierSet(VMModifiers.STATIC);
  }

  get isFinal() {
    return this.isModifierSet(VMModifiers.FINAL);
  }

  get isPrivate() {
    return this.isModifierSet(VMModifiers.PRIVATE);
  }

  get isPackagePrivate() {
    return !this.isModifierSet(VMModifiers.PRIVATE | VMModifiers.PROTECTED | VMModifiers.PUBLIC);
  }

  get isProtected() {
    return this.isModifierSet(VMModifiers.PROTECTED);
  }

  get isPublic() {
    return this.isModifierSet(VMModifiers.PUBLIC);
  }

  get isSynthetic() {
    return this.isModifierSet(VMModifiers.SYNTHETIC);
  }

  isModifierSet(compareBits) {
    return (this.modifiers & compareBits) !== 0;
  }
}

module.exports = TypeComponent;
