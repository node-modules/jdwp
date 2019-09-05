'use strict';

const Base = require('sdk-base');
const ByteType = require('./byte_type');
const CharType = require('./char_type');
const VoidType = require('./void_type');
const LongType = require('./long_type');
const FloatType = require('./float_type');
const ClassType = require('./class_type');
const ShortType = require('./short_type');
const ArrayType = require('./array_type');
const Tag = require('./command/const/tag');
const DoubleType = require('./double_type');
const ByteBuffer = require('./byte_buffer');
const LocalCache = require('./local_cache');
const IntegerType = require('./integer_type');
const BooleanType = require('./boolean_type');
const InterfaceType = require('./interface_type');
const JNITypeParser = require('./jni_type_parser');
const ArrayReference = require('./value/array_reference');
const ThreadReference = require('./value/thread_reference');
const StringReference = require('./value/string_reference');
const ObjectReference = require('./value/object_reference');
const EventRequestManager = require('./event_request_manager');
const SuspendPolicy = require('./command/const/suspend_policy');
const ClassLoaderReference = require('./value/class_loader_reference');
const ClassObjectReference = require('./value/class_object_reference');
const ThreadGroupReference = require('./value/thread_group_reference');

const {
  Version,
  IDSizes,
  Resume,
  Suspend,
  ClassesBySignature,
  Capabilities,
  CapabilitiesNew,
  AllClasses,
  AllClassesWithGeneric,
  ClassPaths,
  SetDefaultStratum,
  AllThreads,
  TopLevelThreadGroups,
  InstanceCounts,
  Dispose,
  Exit,
  CreateString,
  HoldEvents,
  ReleaseEvents,
  RedefineClasses,
} = require('./command').VirtualMachine;

let vmSequenceNumber = 0;

class VirtualMachine extends Base {
  constructor(conn) {
    super({ initMethod: '_init' });
    this._vmStarted = false;
    this._shutdown = false;
    this._theVoidType = null;
    this._theBooleanType = null;
    this._theByteType = null;
    this._theCharType = null;
    this._theShortType = null;
    this._theIntegerType = null;
    this._theLongType = null;
    this._theFloatType = null;
    this._theDoubleType = null;
    // TODO:
    // traceFlags

    this.typesByID = new Map();
    this.objectsByID = new Map();

    this.conn = conn;
    this.conn.on('event', e => {
      const { events } = e;
      for (const event of events) {
        if (event.eventKind === 'VM_START') {
          this._vmStarted = true;
          this.emit('VM_START', event);
        }
        if (event.eventKind === 'VM_DEATH') {
          this._shutdown = true;
          LocalCache.reset();
        }
      }
      this.emit('event', e);
    });

    // TODO:
    this.setMaxListeners(1000);
    this.sequenceNumber = vmSequenceNumber++;
    this.defaultStratum = null;
    this.eventRequestManager = new EventRequestManager(this);
    this.internalEventRequestManager = new EventRequestManager(this);
  }

  async _init() {
    if (!this._vmStarted) {
      await this.await('VM_START');
    }
    this.versionInfo = await this.send(new Version());
    const idSizes = await this.send(new IDSizes());
    ByteBuffer.setFieldIDSize(idSizes.fieldIDSize);
    ByteBuffer.setMethodIDSize(idSizes.methodIDSize);
    ByteBuffer.setObjectIDSize(idSizes.objectIDSize);
    ByteBuffer.setReferenceTypeIDSize(idSizes.referenceTypeIDSize);
    ByteBuffer.setFrameIDSize(idSizes.frameIDSize);

    this.capabilities = await this.send(new Capabilities());
    this.capabilitiesNew = await this.send(new CapabilitiesNew());

    let er = this.internalEventRequestManager.createClassPrepareRequest();
    er.suspendPolicy = SuspendPolicy.NONE;
    await er.enable();
    er = this.internalEventRequestManager.createClassUnloadRequest();
    er.suspendPolicy = SuspendPolicy.NONE;
    await er.enable();
  }

  get version() {
    return this.versionInfo.vmVersion;
  }

  get name() {
    return this.versionInfo.vmName;
  }

  get hasNewCapabilities() {
    return this.versionInfo.jdwpMajor > 1 || this.versionInfo.jdwpMinor >= 4;
  }

  get canWatchFieldModification() {
    return this.capabilities.canWatchFieldModification;
  }

  get canWatchFieldAccess() {
    return this.capabilities.canWatchFieldAccess;
  }

  get canGetBytecodes() {
    return this.capabilities.canGetBytecodes;
  }

  get canGetSyntheticAttribute() {
    return this.capabilities.canGetSyntheticAttribute;
  }

  get canGetOwnedMonitorInfo() {
    return this.capabilities.canGetOwnedMonitorInfo;
  }

  get canGetCurrentContendedMonitor() {
    return this.capabilities.canGetCurrentContendedMonitor;
  }

  get canGetMonitorInfo() {
    return this.capabilities.canGetMonitorInfo;
  }

  get canUseInstanceFilters() {
    return this.hasNewCapabilities && this.capabilitiesNew.canUseInstanceFilters;
  }

  get canUseSourceNameFilters() {
    return this.versionInfo.jdwpMajor > 1 || this.versionInfo.jdwpMinor >= 6;
  }

  get canGet1_5LanguageFeatures() {
    return this.versionInfo.jdwpMajor > 1 || this.versionInfo.jdwpMinor >= 5;
  }

  get canRedefineClasses() {
    return this.hasNewCapabilities && this.capabilitiesNew.canRedefineClasses;
  }

  get canAddMethod() {
    return this.hasNewCapabilities && this.capabilitiesNew.canAddMethod;
  }

  get canUnrestrictedlyRedefineClasses() {
    return this.hasNewCapabilities && this.capabilitiesNew.canUnrestrictedlyRedefineClasses;
  }

  get canPopFrames() {
    return this.hasNewCapabilities && this.capabilitiesNew.canPopFrames;
  }

  get canGetMethodReturnValues() {
    return this.versionInfo.jdwpMajor > 1 || this.versionInfo.jdwpMinor >= 6;
  }

  get canGetInstanceInfo() {
    if (this.versionInfo.jdwpMajor < 1 || this.versionInfo.jdwpMinor < 6) {
      return false;
    }
    return this.hasNewCapabilities && this.capabilitiesNew.canGetInstanceInfo;
  }

  get canForceEarlyReturn() {
    return this.hasNewCapabilities && this.capabilitiesNew.canForceEarlyReturn;
  }

  get canBeModified() {
    return true;
  }

  get canGetSourceDebugExtension() {
    return this.hasNewCapabilities && this.capabilitiesNew.canGetSourceDebugExtension;
  }

  get canGetClassFileVersion() {
    if (this.versionInfo.jdwpMajor < 1 && this.versionInfo.jdwpMinor < 6) {
      return false;
    }
    return true;
  }

  get canGetConstantPool() {
    return this.hasNewCapabilities && this.capabilitiesNew.canGetConstantPool;
  }

  get canRequestVMDeathEvent() {
    return this.hasNewCapabilities && this.capabilitiesNew.canRequestVMDeathEvent;
  }

  get canRequestMonitorEvents() {
    return this.hasNewCapabilities && this.capabilitiesNew.canRequestMonitorEvents;
  }

  get canGetMonitorFrameInfo() {
    return this.hasNewCapabilities && this.capabilitiesNew.canGetMonitorFrameInfo;
  }

  get theVoidType() {
    if (!this._theVoidType) {
      this._theVoidType = new VoidType(this);
    }
    return this._theVoidType;
  }

  get theBooleanType() {
    if (!this._theBooleanType) {
      this._theBooleanType = new BooleanType(this);
    }
    return this._theBooleanType;
  }

  get theByteType() {
    if (!this._theByteType) {
      this._theByteType = new ByteType(this);
    }
    return this._theByteType;
  }

  get theCharType() {
    if (!this._theCharType) {
      this._theCharType = new CharType(this);
    }
    return this._theCharType;
  }

  get theShortType() {
    if (!this._theShortType) {
      this._theShortType = new ShortType(this);
    }
    return this._theShortType;
  }

  get theIntegerType() {
    if (!this._theIntegerType) {
      this._theIntegerType = new IntegerType(this);
    }
    return this._theIntegerType;
  }

  get theLongType() {
    if (!this._theLongType) {
      this._theLongType = new LongType(this);
    }
    return this._theLongType;
  }

  get theFloatType() {
    if (!this._theFloatType) {
      this._theFloatType = new FloatType(this);
    }
    return this._theFloatType;
  }

  get theDoubleType() {
    if (!this._theDoubleType) {
      this._theDoubleType = new DoubleType(this);
    }
    return this._theDoubleType;
  }

  primitiveType(tag) {
    switch (tag) {
      case Tag.BOOLEAN:
        return this.theBooleanType;
      case Tag.BYTE:
        return this.theByteType;
      case Tag.CHAR:
        return this.theCharType;
      case Tag.SHORT:
        return this.theShortType;
      case Tag.INT:
        return this.theIntegerType;
      case Tag.LONG:
        return this.theLongType;
      case Tag.FLOAT:
        return this.theFloatType;
      case Tag.DOUBLE:
        return this.theDoubleType;
      default:
        throw new Error('Unrecognized primitive tag ' + tag);
    }
  }

  async findBootType(signature) {
    const types = await this.allClasses();
    for (const type of types) {
      const loader = await type.getClassLoader();
      const sig = await type.getSignature();
      if (!loader && sig === signature) return type;
    }
    const parser = new JNITypeParser(signature);
    throw new Error('Type ' + parser.typeName + ' not loaded');
  }

  async send(cmd) {
    return await this.conn.send(cmd);
  }

  async retrieveClassesBySignature(signature) {
    const cinfos = await this.send(new ClassesBySignature(signature));
    return cinfos.map(ci => {
      const type = this.referenceType(ci.typeID, ci.refTypeTag, signature);
      type.status = ci.status;
      return type;
    });
  }

  async findReferenceTypes(signature) {
    const list = [];
    for (const type of this.typesByID.values()) {
      const sig = await type.getSignature();
      if (sig === signature) {
        list.push(type);
      }
    }
    return list;
  }

  async classesByName(className) {
    const signature = JNITypeParser.typeNameToSignature(className);
    if (this._retrievedAllTypes) {
      return await this.findReferenceTypes(signature);
    }
    return await this.retrieveClassesBySignature(signature);
  }

  referenceType(id, tag, signature) {
    if (id === 0) return null;
    let retType = this.typesByID.get(id);
    if (retType == null) {
      retType = this.addReferenceType(id, tag, signature);
    }
    return retType;
  }

  addReferenceType(id, tag, signature) {
    let type;
    switch (tag) {
      case 1:
        type = new ClassType(this, id);
        break;
      case 2:
        type = new InterfaceType(this, id);
        break;
      case 3:
        type = new ArrayType(this, id);
        break;
      default:
        throw new Error('Invalid reference type tag: ' + tag);
    }
    if (signature) {
      type.signature = signature;
    }

    this.typesByID.set(id, type);

    return type;
  }

  async removeReferenceType(signature) {
    let matches = 0;
    for (const type of this.typesByID.values()) {
      const sig = await type.getSignature();
      if (sig === signature) {
        this.typesByID.delete(type.ref);
        matches++;
      }
    }
    // ...and if there was more than one, re-retrieve the classes with that name
    if (matches > 1) {
      await this.retrieveClassesBySignature(signature);
    }
  }

  async retrieveAllClasses1_4() {
    const result = await this.send(new AllClasses());
    const cinfos = result.classes;

    if (!this._retrievedAllTypes) {
      for (const ci of cinfos) {
        const type = this.referenceType(ci.typeID, ci.refTypeTag, ci.signature);
        type.status = ci.status;
      }
      this._retrievedAllTypes = true;
    }
  }

  async retrieveAllClasses() {
    if (!this.canGet1_5LanguageFeatures) {
      await this.retrieveAllClasses1_4();
      return;
    }

    const result = await this.send(new AllClassesWithGeneric());
    const cinfos = result.classes;

    if (!this._retrievedAllTypes) {
      for (const ci of cinfos) {
        const type = this.referenceType(ci.typeID, ci.refTypeTag, ci.signature);
        type.genericSignature = ci.genericSignature;
        type.genericSignatureGotten = true;
        type.status = ci.status;
      }
      this._retrievedAllTypes = true;
    }
  }

  async allClasses() {
    if (!this._retrievedAllTypes) {
      await this.retrieveAllClasses();
    }
    return Array.from(this.typesByID.values());
  }

  async allThreads() {
    // TODO: local cache
    const { threads } = await this.send(new AllThreads());

    return threads.map(id => { return this.thread(id); });
  }

  async topLevelThreadGroups() {
    // TODO: local cache
    const { groups } = await this.send(new TopLevelThreadGroups());

    return groups.map(id => { return ThreadGroupReference(this, id); });
  }

  async getClasspath() {
    if (!this.pathInfo) {
      this.pathInfo = await this.send(new ClassPaths());
    }
    return this.pathInfo;
  }

  async setDefaultStratum(stratum) {
    this.defaultStratum = stratum;
    await this.send(new SetDefaultStratum(stratum));
  }

  async suspend() {
    await this.send(new Suspend());
  }

  async resume() {
    LocalCache.reset();
    await this.send(new Resume());
  }

  async instanceCounts(classes) {
    if (!this.canGetInstanceInfo) throw new Error('target does not support getting instances');

    const { counts } = await this.send(new InstanceCounts(classes));
    return counts;
  }

  async dispose() {
    this._shutdown = true;
    LocalCache.reset();
    await this.send(new Dispose());
    this.removeAllListeners();
  }

  async exit(exitCode) {
    if (this._shutdown) return;

    this._shutdown = true;
    LocalCache.reset();
    await this.send(new Exit(exitCode));
    this.removeAllListeners();
  }

  async createString(val) {
    const { stringObject } = await this.send(new CreateString(val));
    return this.objectMirror(stringObject, Tag.STRING);
  }

  async holdEvents() {
    await this.send(new HoldEvents());
  }

  async releaseEvents() {
    await this.send(new ReleaseEvents());
  }

  async redefineClasses(classToBytes) {
    if (!this.canRedefineClasses) throw new Error('target does not support redefine classes');
    await this.send(new RedefineClasses(classToBytes));
  }

  classType(ref) {
    return this.referenceType(ref, 1);
  }

  interfaceType(ref) {
    return this.referenceType(ref, 2);
  }

  thread(id) {
    return this.objectMirror(id, Tag.THREAD);
  }

  objectMirror(id, tag) {
    if (id === '0000000000000000' || id == null) return null;

    if (this.objectsByID.has(id)) return this.objectsByID.get(id);

    // TODO: reference ?

    let object;
    switch (tag) {
      case Tag.OBJECT:
        object = new ObjectReference(this, id);
        break;
      case Tag.STRING:
        object = new StringReference(this, id);
        break;
      case Tag.ARRAY:
        object = new ArrayReference(this, id);
        break;
      case Tag.THREAD:
        object = new ThreadReference(this, id);
        break;
      case Tag.THREAD_GROUP:
        object = new ThreadGroupReference(this, id);
        break;
      case Tag.CLASS_LOADER:
        object = new ClassLoaderReference(this, id);
        break;
      case Tag.CLASS_OBJECT:
        object = new ClassObjectReference(this, id);
        break;
      default:
        throw new Error('Invalid object tag: ' + tag);
    }

    this.objectsByID.set(id, object);
    return object;
  }
}

module.exports = VirtualMachine;
