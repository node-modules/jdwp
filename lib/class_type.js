'use strict';

const {
  Superclass,
  SetValues,
  InvokeMethod,
  NewInstance,
} = require('./command').ClassType;
const ReferenceType = require('./reference_type');

const INVOKE_SINGLE_THREADED = 1;

class ClassType extends ReferenceType {
  constructor(vm, aRef) {
    super(vm, aRef);
    this.superclass = null;
    this.interfaces = null;
    this.cachedSuperclass = false;
  }

  get typeTag() {
    return 1;
  }

  async getSuperclass() {
    if (!this.cachedSuperclass) {
      const { superclass } = await this.vm.send(new Superclass(this.ref));
      if (superclass) {
        this.superclass = this.vm.referenceType(superclass, 1, null);
        await this.superclass.getSignature();
      }
      this.cachedSuperclass = true;
    }
    return this.superclass;
  }

  async getInterfaces() {
    if (!this.interfaces) {
      this.interfaces = await super.getInterfaces();
    }
    return this.interfaces;
  }

  async inheritedTypes() {
    const inherited = [];
    const superclass = await this.getSuperclass();
    if (superclass) {
      inherited.push(superclass);
    }

    const interfaces = await this.getInterfaces();
    for (const rt of interfaces) {
      inherited.push(rt);
    }
    return inherited;
  }

  async isEnum() {
    const superclass = await this.getSuperclass();
    if (superclass) {
      const name = superclass.getName();
      if (name === 'java.lang.Enum') return true;
    }
    return false;
  }

  async isAssignableTo(type) {
    if (this.equals(type)) return true;

    const superclazz = await this.getSuperclass();
    if (superclazz && await superclazz.isAssignableTo(type)) return true;

    const interfaces = await this.getInterfaces();
    if (!interfaces) return false;

    for (const itf of interfaces) {
      if (await itf.isAssignableTo(type)) {
        return true;
      }
    }
    return false;
  }

  async setValue(field, value) {
    await this.validateFieldSet(field);

    if (!field.isStatic) {
      throw new Error('Must set non-static field through an instance');
    }

    await this.vm.send(new SetValues({
      clazz: this.ref,
      values: [{
        fieldID: field.ref,
        value,
      }],
    }));
  }

  async validateMethodInvocation(method) {
    const declType = method.declaringType;
    const r = await declType.isAssignableFrom(this);
    if (!r) {
      throw new Error('Invalid method');
    }

    if (!method.isStatic) {
      throw new Error('Cannot invoke instance method on a class type');
    }
    if (method.isStaticInitializer) {
      throw new Error('Cannot invoke static initializer');
    }
  }

  async invokeMethod(thread, method, args, options) {
    await this.validateMethodInvocation(method);
    args = await method.validateAndPrepareArgumentsForInvoke(args);

    if (options & INVOKE_SINGLE_THREADED) {
      thread.resetLocalCache();
    }

    const ret = await this.vm.send(new InvokeMethod({
      clazz: this.ref,
      thread: thread.ref,
      methodID: method.ref,
      args,
      options,
    }));
    const exception = this.vm.objectMirror(ret.exception.objectId, ret.exception.tag);
    if (exception) {
      const err = new Error('Exception occurred in target VM');
      err.exception = exception;
      throw err;
    }

    // TODO: INVOKE_SINGLE_THREADED

    return ret.returnValue;
  }

  async addVisibleMethods(methodMap) {
    const interfaces = await this.getInterfaces();
    for (const iter of interfaces) {
      await iter.addVisibleMethods(methodMap);
    }
    const superclass = await this.getSuperclass();
    if (!superclass) {
      await superclass.addVisibleMethods(methodMap);
    }
    this.addToMethodMap(methodMap, await this.getMethods());
  }

  async validateConstructorInvocation(method) {
    const declType = method.declaringType;
    if (declType.ref !== this.ref) {
      throw new Error('Invaild constructor');
    }
    if (!method.isConstructor) {
      throw new Error('Cannot create instance with non-constructor');
    }
  }

  async newInstance(thread, method, origArguments, options) {
    await this.validateConstructorInvocation(method);
    const args = await method.validateAndPrepareArgumentsForInvoke(origArguments);

    if (options & INVOKE_SINGLE_THREADED) {
      thread.resetLocalCache();
    }

    const ret = await this.vm.send(new NewInstance({
      clazz: this.ref,
      thread: thread.ref,
      methodID: method.ref,
      args,
      options,
    }));
    const exception = this.vm.objectMirror(ret.exception.objectId, ret.exception.tag);
    if (exception) {
      const err = new Error('Exception occurred in target VM');
      err.exception = exception;
      throw err;
    }

    // TODO: INVOKE_SINGLE_THREADED

    return ret.newObject;
  }
}

module.exports = ClassType;
