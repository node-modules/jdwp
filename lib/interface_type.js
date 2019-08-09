'use strict';

const ReferenceType = require('./reference_type');

class InterfaceType extends ReferenceType {

  constructor(vm, aRef) {
    super(vm, aRef);
    this.superinterfacesRef = null;
  }

  get typeTag() {
    return 2;
  }

  async getSuperclass() {
    return null;
  }

  async getInterfaces() {
    return await this.getSuperinterfaces();
  }

  async getSuperinterfaces() {
    if (!this.superinterfacesRef) {
      this.superinterfacesRef = await super.getInterfaces();
    }
    return this.superinterfacesRef;
  }

  async inheritedTypes() {
    return await this.getSuperinterfaces();
  }

  async isAssignableTo(type) {
    const name = await type.getName();
    if (name === 'java.lang.Object') return true;

    const interfaces = await this.getInterfaces();
    if (!interfaces) return false;

    for (const itf of interfaces) {
      if (await itf.isAssignableTo(type)) {
        return true;
      }
    }
    return false;
  }

  async addVisibleMethods(methodMap) {
    const superinterfaces = await this.getSuperinterfaces();
    for (const interfaze of superinterfaces) {
      await interfaze.addVisibleMethods(methodMap);
    }
    this.addToMethodMap(methodMap, await this.getMethods());
  }
}

module.exports = InterfaceType;
