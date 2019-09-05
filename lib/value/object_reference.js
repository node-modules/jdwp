'use strict';

const {
  ReferenceType,
  InvokeMethod,
  GetValues,
  SetValues,
  MonitorInfo,
  DisableCollection,
  EnableCollection,
  IsCollected,
  ReferringObjects,
} = require('../command').ObjectReference;
const Value = require('../value');
const JNITypeParser = require('../jni_type_parser');

const INVOKE_SINGLE_THREADED = 1;
const INVOKE_NONVIRTUAL = 2;

class ObjectReference extends Value {
  constructor(vm, ref) {
    super(vm);
    this.ref = ref;
    this.type = null;
    this.gcDisableCount = 0;
  }

  get typeValueKey() {
    return 76;
  }

  async getType() {
    return await this.referenceType();
  }

  async referenceType() {
    if (!this.type) {
      const { typeID, refTypeTag } = await this.vm.send(new ReferenceType(this.ref));
      this.type = this.vm.referenceType(typeID, refTypeTag);
    }
    return this.type;
  }

  async prepareForAssignmentTo(destination) {
    /*
     * Do these simpler checks before attempting a query of the destination's
     * type which might cause a confusing ClassNotLoadedException if
     * the destination is primitive or an array.
     */
    /*
     * TO DO: Centralize JNI signature knowledge
     */
    if (destination.signature.length === 1) {
      throw new Error('Can\'t assign object value to primitive');
    }
    const type = await this.getType();
    const signature = await type.getSignature();
    if (destination.signature[0] === '[' && signature[0] !== '[') {
      throw new Error('Can\'t assign non-array value to an array');
    }
    if (destination.typeName === 'void') {
      throw new Error('Can\'t assign object value to a void');
    }

    // Validate assignment
    const destType = destination.type;
    const myType = await this.referenceType();
    const r = await myType.isAssignableTo(destType);
    if (!r) {
      const parser = new JNITypeParser(await destType.getSignature());
      const destTypeName = parser.typeName;
      throw new Error('Can\'t assign ' + type.name + ' to ' + destTypeName);
    }
    return {
      tag: this.typeValueKey,
      value: this.ref,
    };
  }

  equals(other) {
    if (other && other.ref === this.ref) return true;
    return false;
  }

  async validateMethodInvocation(method, options) {
    const declType = method.declaringType;
    const r = await declType.isAssignableFrom(this);
    if (!r) {
      throw new Error('Invalid method');
    }
    if (method.isConstructor) {
      throw new Error('Cannot invoke constructor');
    }
    /*
     * For nonvirtual invokes, method must have a body
     */
    if ((options & INVOKE_NONVIRTUAL) !== 0) {
      if (declType.typeTag === 2) {
        throw new Error('Interface method');
      } else if (method.isAbstract) {
        throw new Error('Abstract method');
      }
    }
  }

  async invokeMethod(thread, method, origArguments, options) {
    const type = await this.referenceType();
    if (method.isStatic) {
      if (type.typeTag === 1) {
        return await type.invokeMethod(thread, method, origArguments, options);
      }
      throw new Error('Invalid type for static method invocation');
    }

    await this.validateMethodInvocation(method, options);

    const args = await method.validateAndPrepareArgumentsForInvoke(origArguments);

    if (options & INVOKE_SINGLE_THREADED) {
      thread.resetLocalCache();
    }

    const ret = await this.vm.send(new InvokeMethod({
      object: this.ref,
      clazz: type.ref,
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

  async getValues(theFields) {
    const type = await this.referenceType();
    const staticFields = [];
    const instanceFields = [];

    for (const field of theFields) {
      await type.validateFieldAccess(field);
      if (field.isStatic) {
        staticFields.push(field);
      } else {
        instanceFields.push(field);
      }
    }

    const map = new Map();
    if (staticFields.length) {
      const staticValues = await type.getValues(staticFields);
      const len = staticFields.length;
      for (let i = 0; i < len; i++) {
        map.set(staticFields[i].ref, staticValues[i]);
      }
    }

    const size = instanceFields.length;
    const { values } = await this.vm.send(new GetValues({
      object: this.ref,
      fields: instanceFields.map(field => field.ref),
    }));
    if (values.length !== size) {
      throw new Error('Wrong number of values returned from target VM');
    }
    for (let i = 0; i < size; i++) {
      map.set(instanceFields[i].ref, values[i]);
    }
    return theFields.map(field => {
      return map.get(field.ref);
    });
  }

  async getValue(field) {
    const vals = await this.getValues([ field ]);
    return vals[0];
  }

  async setValue(field, value) {
    const type = await this.referenceType();
    await type.validateFieldSet(field);

    if (field.isStatic) {
      if (type.typeTag === 1) {
        await type.setValue(field, value);
        return;
      }
      throw new Error('Invalid type for static field set');
    }

    await this.vm.send(new SetValues({
      object: this.ref,
      values: [{
        fieldID: field.ref,
        value,
      }],
    }));
  }

  async monitorInfo() {
    // TODO: cache
    const result = await this.vm.send(new MonitorInfo(this.ref));
    return {
      owner: this.vm.thread(result.owner),
      entryCount: result.entryCount,
      waiters: result.waiters.map(w => this.vm.thread(w)),
    };
  }

  async disableCollection() {
    if (this.gcDisableCount === 0) {
      await this.vm.send(new DisableCollection(this.ref));
    }
    this.gcDisableCount++;
  }

  async enableCollection() {
    this.gcDisableCount--;

    if (this.gcDisableCount === 0) {
      await this.vm.send(new EnableCollection(this.ref));
    }
  }

  async isCollected() {
    const result = await this.vm.send(new IsCollected(this.ref));
    return result.isCollected;
  }

  async referringObjects(maxReferrers) {
    if (!this.vm.canGetInstanceInfo) {
      throw new Error('target does not support getting referring objects');
    }
    if (maxReferrers < 0) {
      throw new Error('maxReferrers is less than zero: ' + maxReferrers);
    }
    const { referringObjects } = await this.vm.send(new ReferringObjects({
      object: this.ref,
      maxReferrers,
    }));
    return referringObjects.map(item => {
      return this.vm.objectMirror(item.objectId, item.tag);
    });
  }
}

module.exports = ObjectReference;
