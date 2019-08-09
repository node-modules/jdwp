'use strict';

const {
  Fields,
  FieldsWithGeneric,
  Status,
  Modifiers,
  Signature,
  SignatureWithGeneric,
  Interfaces,
  Methods,
  MethodsWithGeneric,
  SourceDebugExtension,
  SourceFile,
  GetValues,
  ClassObject,
  Instances,
  ClassFileVersion,
  ConstantPool,
  ClassLoader,
} = require('./command').ReferenceType;
const SDE = require('./sde');
const path = require('path');
const Long = require('long');
const Type = require('./type');
const assert = require('assert');
const Field = require('./field');
const Method = require('./method');
const ClassStatus = require('./command/const/class_status');
const VMModifiers = require('./command/const/vm_modifiers');

const INITIALIZED_OR_FAILED = ClassStatus.INITIALIZED | ClassStatus.ERROR;
const NO_SDE_INFO_MARK = new SDE();

class ReferenceType extends Type {
  constructor(vm, aRef) {
    super(vm);
    this.signature = null;
    this.genericSignature = null;
    this.ref = aRef;
    this.status = 0;
    this.modifiers = -1;
    this.fieldsRef = null;
    this.methodsRef = null;
    this.interfaces = null;
    this.genericSignatureGotten = false;
    this.baseSourceDir = null;
    this.baseSourceName = null;
    this.baseSourcePath = null;
    this.classLoader = null;
    this.classObject = null;
    this.classFileVersion = null;
    this.jdwpCPool = null;
  }

  equals(other) {
    if (this.ref === other.ref && this.vm === other.vm) return true;
    return false;
  }

  compareTo(other) {
    let comp = this.name.localeCompare(other.name);
    if (comp === 0) {
      comp = Long.fromString(this.ref).compare(other.ref);
      if (comp === 0) {
        comp = this.vm.sequenceNumber - other.vm.sequenceNumber;
      }
    }
    return comp;
  }

  async getBaseSourceName() {
    let name = this.baseSourceName;
    if (!name) {
      try {
        const { sourceFile } = await this.vm.send(new SourceFile(this.ref));
        name = sourceFile;
      } catch (err) {
        if (err.code !== 101) {
          throw err;
        }
        name = '**ABSENT_BASE_SOURCE_NAME**';
      }
      this.baseSourceName = name;
    }
    if (name === '**ABSENT_BASE_SOURCE_NAME**') throw new Error('Absent information');

    return name;
  }

  async getBaseSourcePath() {
    if (!this.baseSourcePath) {
      const dir = await this.getBaseSourceDir();
      const name = await this.getBaseSourceName();
      this.baseSourcePath = dir + name;
    }
    return this.baseSourcePath;
  }

  async getBaseSourceDir() {
    if (!this.baseSourceDir) {
      const typeName = await this.getName();
      this.baseSourceDir = path.join(...typeName.split('.')) + path.sep;
    }
    return this.baseSourceDir;
  }

  async isPublic() {
    if (this.modifiers === -1) {
      await this.getModifiers();
    }
    return (this.modifiers & VMModifiers.PUBLIC) > 0;
  }

  async isProtected() {
    if (this.modifiers === -1) {
      await this.getModifiers();
    }
    return (this.modifiers & VMModifiers.PROTECTED) > 0;
  }

  async isPrivate() {
    if (this.modifiers === -1) {
      await this.getModifiers();
    }
    return (this.modifiers & VMModifiers.PRIVATE) > 0;
  }

  async isPackagePrivate() {
    const isPublic = await this.isPublic();
    const isPrivate = await this.isPrivate();
    const isProtected = await this.isProtected();
    return !isPublic && !isPrivate && !isProtected;
  }

  async isAbstract() {
    if (this.modifiers === -1) {
      await this.getModifiers();
    }
    return (this.modifiers & VMModifiers.ABSTRACT) > 0;
  }

  async isFinal() {
    if (this.modifiers === -1) {
      await this.getModifiers();
    }
    return (this.modifiers & VMModifiers.FINAL) > 0;
  }

  async isStatic() {
    if (this.modifiers === -1) {
      await this.getModifiers();
    }
    return (this.modifiers & VMModifiers.STATIC) > 0;
  }

  async getModifiers() {
    if (this.modifiers !== -1) return;

    const { modBits } = await this.vm.send(new Modifiers(this.ref));
    this.modifiers = modBits;
  }

  async isPrepared() {
    if (this.status === 0) {
      await this.updateStatus();
    }
    return (this.status & ClassStatus.PREPARED) !== 0;
  }

  async isVerified() {
    if ((this.status & ClassStatus.VERIFIED) === 0) {
      await this.updateStatus();
    }
    return (this.status & ClassStatus.VERIFIED) !== 0;
  }

  async isInitialized() {
    if ((this.status & INITIALIZED_OR_FAILED) === 0) {
      await this.updateStatus();
    }
    return (this.status & ClassStatus.INITIALIZED) !== 0;
  }

  async failedToInitialize() {
    if ((this.status & INITIALIZED_OR_FAILED) === 0) {
      await this.updateStatus();
    }
    return (this.status & ClassStatus.ERROR) !== 0;
  }

  async updateStatus() {
    const { status } = await this.vm.send(new Status(this.ref));
    this.status = status;
  }

  async getSignature() {
    if (this.signature == null) {
      if (this.vm.canGet1_5LanguageFeatures) {
        await this.getGenericSignature();
      } else {
        this.signature = await this.vm.send(new Signature(this.ref));
      }
    }
    return this.signature;
  }

  async getGenericSignature() {
    if (this.vm.canGet1_5LanguageFeatures && !this.genericSignatureGotten) {
      const result = await this.vm.send(new SignatureWithGeneric(this.ref));
      this.signature = result.signature;
      this.genericSignature = result.genericSignature ? result.genericSignature : null;
      this.genericSignatureGotten = true;
    }
    return this.genericSignature;
  }

  async fields() {
    let fields = this.fieldsRef;
    if (!fields) {
      if (this.vm.canGet1_5LanguageFeatures) {
        const { declared } = await this.vm.send(new FieldsWithGeneric(this.ref));
        fields = declared.map(fi => {
          const field = new Field(this.vm, this, fi.fieldID, fi.name, fi.signature, fi.genericSignature, fi.modBits);
          return field;
        });
      } else {
        const { declared } = await this.vm.send(new Fields(this.ref));
        fields = declared.map(fi => {
          const field = new Field(this.vm, this, fi.fieldID, fi.name, fi.signature, null, fi.modBits);
          return field;
        });
      }
      this.fieldsRef = fields;
    }
    return fields;
  }

  indexOf(field) {
    const fields = this.fieldsRef;
    if (!fields) return -1;

    for (let i = 0, len = fields.length; i < len; i++) {
      const item = fields[i];
      if (item.equals(field)) return i;
    }
    return -1;
  }

  async inheritedTypes() {
    throw new Error('not implement');
  }

  async addVisibleFields(visibleList, visibleTable, ambiguousNames) {
    const fields = await this.visibleFields();
    for (const field of fields) {
      const name = field.name;
      if (!ambiguousNames.has(name)) {
        const duplicate = visibleTable.get(name);
        if (!duplicate) {
          visibleList.add(field);
          visibleTable.set(name, field);
        } else if (!field.equals(duplicate)) {
          ambiguousNames.add(name);
          visibleTable.delete(name);
          visibleList.delete(duplicate);
        } else {
          // identical field from two branches; do nothing
        }
      }
    }
  }

  async visibleFields() {
    const visibleList = new Set();
    const visibleTable = new Map();
    const ambiguousNames = new Set();

    const types = await this.inheritedTypes();
    for (const type of types) {
      await type.addVisibleFields(visibleList, visibleTable, ambiguousNames);
    }

    const fields = await this.fields();
    const retList = fields.slice();
    for (const field of fields) {
      const hidden = visibleTable.get(field.name);
      if (hidden) {
        visibleList.delete(hidden);
      }
    }
    retList.concat(Array.from(visibleList));
    return retList;
  }

  async getInterfaces() {
    if (!this.interfaces) {
      const { interfaces } = await this.vm.send(new Interfaces(this.ref));
      this.interfaces = await Promise.all(interfaces.map(async ({ interfaceType }) => {
        const intf = this.vm.referenceType(interfaceType, 2, null);
        await intf.getSignature();
        return intf;
      }));
    }
    return this.interfaces;
  }

  async getMethods() {
    let methods = this.methodsRef;
    if (!methods) {
      if (!this.vm.canGet1_5LanguageFeatures) {
        methods = await this.getMethods1_4();
      } else {
        const { declared } = await this.vm.send(new MethodsWithGeneric(this.ref));
        methods = declared.map(mi => {
          const method = Method.createMethod(this.vm, this, mi.methodID, mi.name, mi.signature, mi.genericSignature, mi.modBits);
          return method;
        });
      }
      this.methodsRef = methods;
    }
    return methods;
  }

  async getMethods1_4() {
    const { declared } = await this.vm.send(new Methods(this.ref));
    return declared.map(mi => {
      const method = Method.createMethod(this.vm, this, mi.methodID, mi.name, mi.signature, null, mi.modBits);
      return method;
    });
  }

  async stratum(stratumID) {
    let sde = await this.sourceDebugExtensionInfo();
    if (!sde.isValid) {
      sde = NO_SDE_INFO_MARK;
    }
    return sde.stratum(stratumID);
  }

  async sourceDebugExtensionInfo() {
    if (!this.vm.canGetSourceDebugExtension) {
      return NO_SDE_INFO_MARK;
    }
    let sde = this.sdeRef;
    if (!sde) {
      let extension;
      try {
        const result = await this.vm.send(new SourceDebugExtension(this.ref));
        extension = result.extension;
      } catch (err) {
        if (err.name !== 'ABSENT_INFORMATION') {
          this.sdeRef = NO_SDE_INFO_MARK;
          throw err;
        }
      }
      if (!extension) {
        sde = NO_SDE_INFO_MARK;
      } else {
        sde = new SDE(extension);
      }
      this.sdeRef = sde;
    }
    return sde;
  }

  async allLineLocations(stratumID = this.vm.defaultStratum, sourceName = null) {
    // A method that should have info, didn't
    let someAbsent = false;
    // A method that should have info, did
    let somePresent = false;
    const methods = await this.getMethods();
    const stratum = await this.stratum(stratumID);
    let list = [];

    for (const method of methods) {
      if (!method.isAbstract && !method.isNative) {
        try {
          const locations = await method.allLineLocations(stratum, sourceName);
          list = list.concat(locations);
          somePresent = true;
        } catch (err) {
          someAbsent = true;
        }
      }
    }
    if (someAbsent && !somePresent) {
      throw new Error('absent information exception');
    }
    return list;
  }

  async locationsOfLine(lineNumber, sourceName = null, stratumID = this.vm.defaultStratum) {
    // A method that should have info, didn't
    let someAbsent = false;
    // A method that should have info, did
    let somePresent = false;
    const methods = await this.getMethods();
    const stratum = await this.stratum(stratumID);
    let list = [];

    for (const method of methods) {
      if (!method.isAbstract && !method.isNative) {
        try {
          const locations = await method.locationsOfLine(stratum, sourceName, lineNumber);
          list = list.concat(locations);
          somePresent = true;
        } catch (err) {
          someAbsent = true;
        }
      }
    }
    if (someAbsent && !somePresent) {
      throw new Error('absent information exception');
    }
    return list;
  }

  async getMethod(ref) {
    if (ref === '0000000000000000') {
      // obsolete method
      // TODO:
      throw new Error('not implement');
    }

    const methods = await this.getMethods();
    for (const method of methods) {
      if (method.ref === ref) return method;
    }
    throw new Error('Invalid method id: ' + ref);
  }

  addToMethodMap(methodMap, methodList) {
    for (const method of methodList) {
      methodMap.set(method.name + method.signature, method);
    }
  }

  async addVisibleMethods() {
    throw new Error('not implement');
  }

  async allMethods() {
    throw new Error('not implement');
  }

  async visibleMethods() {
    const methodMap = new Map();
    await this.addVisibleMethods(methodMap);
    // TODO: sort
    return Array.from(methodMap.values());
  }

  async methodsByName(name) {
    const methods = await this.visibleMethods();
    const retList = [];
    for (const candidate of methods) {
      if (candidate.name === name) {
        retList.push(candidate);
      }
    }
    return retList;
  }

  async getClassLoader() {
    if (!this.classLoader) {
      const { classLoader } = await this.vm.send(new ClassLoader(this.ref));
      this.classLoader = this.vm.objectMirror(classLoader, 108);
    }
    return this.classLoader;
  }

  async nestedTypes() {
    const all = await this.vm.allClasses();
    const nested = [];
    const outername = await this.getName();
    const outerlen = outername.length;

    for (const refType of all) {
      const name = await refType.getName();
      const len = name.length;
      if (outerlen > len && name.startsWith(outername)) {
        const c = name[outerlen];
        if (c === '$' || c === '#') {
          nested.push(refType);
        }
      }
    }
    return nested;
  }

  async getValues(fields = []) {
    if (fields.some(field => !field.isStatic)) {
      throw new Error('Attempt to use non-static field with ReferenceType');
    }

    const { values } = await this.vm.send(new GetValues({
      refType: this.ref,
      fields: fields.map(field => field.ref),
    }));
    if (fields.length !== values.length) throw new Error('Wrong number of values returned from target VM');

    return values;
  }

  async getClassObject() {
    if (!this.classObject) {
      const { classObject } = await this.vm.send(new ClassObject(this.ref));
      this.classObject = this.vm.objectMirror(classObject, 99);
    }
    return this.classObject;
  }

  async instances(maxInstances) {
    if (!this.vm.canGetInstanceInfo) throw new Error('target does not support getting instances');

    assert(maxInstances >= 0, 'maxInstances is less than zero: ' + maxInstances);

    const { instances } = await this.vm.send(new Instances({
      refType: this.ref,
      maxInstances,
    }));
    return instances.map(i => this.vm.objectMirror(i.objectId, i.tag));
  }

  async getClassFileVersion() {
    if (!this.vm.canGetClassFileVersion) {
      throw new Error('Unsupported Operation');
    }
    if (!this.classFileVersion) {
      this.classFileVersion = await this.vm.send(new ClassFileVersion(this.ref));
    }
    return this.classFileVersion;
  }

  async getConstantPoolInfo() {
    if (!this.vm.canGetConstantPool) {
      throw new Error('Unsupported Operation');
    }
    if (!this.jdwpCPool) {
      this.jdwpCPool = this.vm.send(new ConstantPool(this.ref));
    }
    return this.jdwpCPool;
  }

  async isAssignableFrom(type) {
    if (type && type.referenceType) {
      type = await type.referenceType();
    }
    return await type.isAssignableTo(this);
  }

  async validateFieldAccess(field) {
    const declType = field.declaringType;
    const r = await declType.isAssignableFrom(this);
    if (!r) {
      throw new Error('Invalid field ' + field.name);
    }
  }

  async validateFieldSet(field) {
    await this.validateFieldAccess(field);
    if (field.isFinal) {
      throw new Error('Cannot set value of final field');
    }
  }

  isPrimitiveArray(signature) {
    const i = signature.lastIndexOf('[');
    /*
     * TO DO: Centralize JNI signature knowledge.
     *
     * Ref:
     *  jdk1.4/doc/guide/jpda/jdi/com/sun/jdi/doc-files/signature.html
     */
    let isPA;
    if (i < 0) {
      isPA = false;
    } else {
      const c = signature[i + 1];
      isPA = (c !== 'L');
    }
    return isPA;
  }

  async findType(signature) {
    let type;
    if (signature.length === 1) {
      const sig = signature[0];
      if (sig === 'V') {
        type = this.vm.theVoidType;
      } else {
        type = this.vm.primitiveType(sig.charCodeAt(0));
      }
    } else {
      const loader = await this.getClassLoader();
      if (!loader || this.isPrimitiveArray(signature)) {
        type = await this.vm.findBootType(signature);
      } else {
        type = await loader.findType(signature);
      }
    }
    return type;
  }

  async fieldByName(fieldName) {
    const searchList = await this.visibleFields();
    for (const field of searchList) {
      if (field.name === fieldName) {
        return field;
      }
    }
    return null;
  }
}

module.exports = ReferenceType;
