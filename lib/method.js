'use strict';

const {
  LineTable,
  VariableTable,
  VariableTableWithGeneric,
  Bytecodes,
  IsObsolete,
} = require('./command').Method;
const Value = require('./value');
const Location = require('./location');
const BaseLineInfo = require('./base_line_info');
const LocalVariable = require('./local_variable');
const TypeComponent = require('./type_component');
const JNITypeParser = require('./jni_type_parser');
const VMModifiers = require('./command/const/vm_modifiers');

class Method extends TypeComponent {
  constructor(vm, declaringType, ref, name, signature, genericSignature, modifiers) {
    super(vm, declaringType, ref, name, signature, genericSignature, modifiers);
    this.signatureParser = new JNITypeParser(signature);
  }

  get isVarArgs() {
    return this.isModifierSet(VMModifiers.VARARGS);
  }

  get isAbstract() {
    return this.isModifierSet(VMModifiers.ABSTRACT);
  }

  get isNative() {
    return this.isModifierSet(VMModifiers.NATIVE);
  }

  get isConstructor() {
    return this.name === '<init>';
  }

  get isStaticInitializer() {
    return this.name === '<clinit>';
  }

  get argumentTypeNames() {
    return this.signatureParser.argumentTypeNames;
  }

  get argumentSignatures() {
    return this.signatureParser.argumentSignatures;
  }

  get returnTypeName() {
    return this.signatureParser.typeName;
  }

  get returnSignature() {
    return this.signatureParser.signature;
  }

  async argumentType(index) {
    const enclosing = this.declaringType;
    const signature = this.argumentSignatures[index];
    return await enclosing.findType(signature);
  }

  async argumentTypes() {
    const size = this.argumentSignatures.length;
    const types = [];
    for (let i = 0; i < size; i++) {
      const type = await this.argumentType(i);
      types.push(type);
    }
    return types;
  }

  async handleVarArgs(args) {
    const paramTypes = await this.argumentTypes();
    const lastParamType = paramTypes[paramTypes.length - 1];
    // const componentType = await lastParamType.componentType();
    const argCount = args.length;
    const paramCount = paramTypes.length;
    if (argCount < paramCount - 1) {
      // Error; will be caught later.
      return;
    }
    if (argCount === paramCount - 1) {
      // It is ok to pass 0 args to the var arg.
      // We have to gen a 0 length array.
      const argArray = await lastParamType.newInstance(0);
      args.push(argArray);
      return;
    }
    const nthArgValue = args[paramCount - 1];
    if (nthArgValue == null) {
      return;
    }
    const nthArgType = await nthArgValue.getType();
    // ArrayType
    if (nthArgType.typeTag === 3) {
      if (argCount === paramCount && await nthArgType.isAssignableTo()) {
        /*
         * This is case 1.  A compatible array is being passed to the
         * var args array param.  We don't have to do anything.
         */
        return;
      }
    }

    /*
     * Case 2.  We have to verify that the n, n+1, ... args are compatible
     * with componentType, and do conversions if necessary and create
     * an array of componentType to hold these possibly converted values.
     */
    const count = argCount - paramCount + 1;
    const argArray = await lastParamType.newInstance(count);

    /*
     * This will copy arguments(paramCount - 1) ... to argArray(0) ...
     * doing whatever conversions are needed!  It will throw an
     * exception if an incompatible arg is encountered
     */
    await argArray.setValues(0, args, paramCount - 1, count);
    args[paramCount - 1] = argArray;

    /*
     * Remove the excess args
     */
    let ii = argCount - paramCount;
    while (ii--) {
      args.pop();
    }
    return;
  }

  async validateAndPrepareArgumentsForInvoke(origArguments) {
    const args = origArguments.slice(0);
    if (this.isVarArgs) {
      await this.handleVarArgs(args);
    }
    const argSize = args.length;
    const parser = new JNITypeParser(this.signature);
    const signatures = parser.argumentSignatures;

    if (signatures.length !== argSize) {
      throw new Error('Invalid argument count: expected ' + signatures.length + ', received ' + argSize);
    }

    for (let i = 0; i < argSize; i++) {
      // TODO:
      const value = await Value.prepareForAssignment(args[i], {
        signature: this.argumentSignatures[i],
        typeName: this.argumentTypeNames[i],
        type: await this.argumentType(i),
      });
      args[i] = value;
    }
    return args;
  }

  async codeIndexToLineInfo(stratum /* , codeIndex*/) {
    if (stratum.isJava) {
      return new BaseLineInfo(-1, this.declaringType);
    }
    throw new Error('not supported');
  }

  async findType(signature) {
    const enclosing = this.declaringType;
    return await enclosing.findType(signature);
  }

  async returnType() {
    return await this.findType(this.returnSignature);
  }

  async isObsolete() {
    const { isObsolete } = await this.vm.send(new IsObsolete({
      refType: this.declaringType.ref,
      methodID: this.ref,
    }));
    return isObsolete;
  }

  equals(other) {
    if (!other) return false;
    return this.declaringType.equals(other.declaringType) && this.ref === other.ref && super.equals(other);
  }
}

class NonConcreteMethod extends Method {
  async locationsOfLine() {
    return [];
  }

  async allLineLocations() {
    return [];
  }

  async getVariables() {
    return [];
  }

  async bytecodes() {
    return Buffer.alloc(0);
  }
}

class ConcreteMethod extends Method {
  constructor(...args) {
    super(...args);
    this.softBaseLocationXRefsRef = null;
    this.location = null;
    this.firstIndex = -1;
    this.lastIndex = -1;
    this.variables = null;
    this.argSlotCount = -1;
    this.bytecodesRef = null;
  }

  async locationsOfLine(stratum, sourceName, lineNumber) {
    const info = await this.getLocations(stratum);
    if (info.lineLocations.length === 0) {
      throw new Error('absent information');
    }
    const list = info.lineMapper.get(lineNumber) || [];
    return this.sourceNameFilter(list, stratum, sourceName);
  }

  sourceNameFilter(list, stratum, sourceName) {
    if (sourceName == null) {
      return list;
    }
    /* needs sourceName filteration */
    const locs = [];
    for (const loc of list) {
      if (loc.sourceName(stratum) === sourceName) {
        locs.push(loc);
      }
    }
    return locs;
  }

  async getBaseLocations() {
    if (this.softBaseLocationXRefsRef) return this.softBaseLocationXRefsRef;

    const lntab = await this.vm.send(new LineTable({
      refType: this.declaringType.ref,
      methodID: this.ref,
    }));

    let lowestLine = -1;
    let highestLine = -1;
    const lineMapper = new Map();
    const lineLocations = [];
    const count = lntab.lines.length;
    for (let i = 0; i < count; i++) {
      const bci = lntab.lines[i].lineCodeIndex;
      const lineNumber = lntab.lines[i].lineNumber;

      if ((i + 1 === count) || (bci !== lntab.lines[i + 1].lineCodeIndex)) {
        // Remember the largest/smallest line number
        if (lineNumber > highestLine) {
          highestLine = lineNumber;
        }
        if ((lineNumber < lowestLine) || (lowestLine === -1)) {
          lowestLine = lineNumber;
        }
        const loc = new Location(this.vm, this, bci);
        loc.baseLineInfo = new BaseLineInfo(lineNumber, this.declaringType);

        // Add to the location list
        lineLocations.push(loc);

        // Add to the line -> locations map
        const key = lineNumber;
        let mappedLocs = lineMapper.get(key);
        if (mappedLocs == null) {
          mappedLocs = [];
          lineMapper.set(key, mappedLocs);
        }
        mappedLocs.push(loc);
      }
    }

    if (!this.location) {
      this.firstIndex = lntab.start;
      this.lastIndex = lntab.end;
      /*
       * The startLocation is the first one in the
       * location list if we have one;
       * otherwise, we construct a location for a
       * method start with no line info
       */
      if (count > 0) {
        this.location = lineLocations[0];
      } else {
        this.location = new Location(this.vm, this, this.firstIndex);
      }
    }
    this.softBaseLocationXRefsRef = {
      stratumID: 'Java',
      lineMapper,
      lineLocations,
      lowestLine,
      highestLine,
    };
    return this.softBaseLocationXRefsRef;
  }

  async getLocations(stratum) {
    if (stratum.isJava) {
      return await this.getBaseLocations();
    }
    throw new Error('not supported');
  }

  async codeIndexToLineInfo(stratum, codeIndex) {
    if (this.firstIndex === -1) {
      await this.getBaseLocations();
    }
    if (codeIndex < this.firstIndex || codeIndex > this.lastIndex) {
      throw new Error('Location with invalid code index');
    }

    const lineLocations = await this.getLocations(stratum).lineLocations;

    /*
     * Check for absent line numbers.
     */
    if (lineLocations.length === 0) {
      return await super.codeIndexToLineInfo(stratum, codeIndex);
    }

    /*
     * Treat code before the beginning of the first line table
     * entry as part of the first line.  javac will generate
     * code like this for some local classes. This "prolog"
     * code contains assignments from locals in the enclosing
     * scope to synthetic fields in the local class.  Same for
     * other language prolog code.
     */
    let bestMatch = lineLocations[0];
    for (let i = 1, len = lineLocations.length; i < len; i++) {
      const current = lineLocations[i];
      if (current.codeIndex > codeIndex) {
        break;
      }
      bestMatch = current;
    }
    return await bestMatch.getLineInfo(stratum);
  }

  async allLineLocations(stratum, sourceName) {
    const { lineLocations } = await this.getLocations(stratum);

    if (lineLocations.length === 0) {
      throw new Error('absent information');
    }

    return this.sourceNameFilter(lineLocations, stratum, sourceName);
  }

  async getVariables1_4() {
    try {
      const vartab = await this.vm.send(new VariableTable({
        refType: this.declaringType.ref,
        methodID: this.ref,
      }));
      this.argSlotCount = vartab.argCnt;
      const variables = [];
      for (const slot of vartab.slots) {
        if (!slot.name.startsWith('this$') && !slot.name === 'this') {
          const scopeStart = new Location(this.vm, this, slot.codeIndex);
          const scopeEnd = new Location(this.vm, this, slot.codeIndex + slot.length - 1);
          const variable = new LocalVariable(this.vm, this, slot.slot, scopeStart, scopeEnd, slot.name, slot.signature);
          variables.push(variable);
        }
      }
      return variables;
    } catch (err) {
      if (err.name === 'ABSENT_INFORMATION') {
        return [];
      }
      throw err;
    }
  }

  async getVariables() {
    if (!this.variables) {
      if (!this.vm.canGet1_5LanguageFeatures) {
        this.variables = await this.getVariables1_4();
      } else {
        try {
          const vartab = await this.vm.send(new VariableTableWithGeneric({
            refType: this.declaringType.ref,
            methodID: this.ref,
          }));
          this.argSlotCount = vartab.argCnt;
          this.variables = [];
          for (const slot of vartab.slots) {
            if (!slot.name.startsWith('this$') && slot.name !== 'this') {
              const scopeStart = new Location(this.vm, this, slot.codeIndex);
              const scopeEnd = new Location(this.vm, this, slot.codeIndex + slot.length - 1);
              const variable = new LocalVariable(this.vm, this, slot.slot, scopeStart, scopeEnd, slot.name, slot.signature, slot.genericSignature);
              this.variables.push(variable);
            }
          }
        } catch (err) {
          if (err.name === 'ABSENT_INFORMATION') {
            this.variables = [];
            return [];
          }
          throw err;
        }
      }
    }
    return this.variables;
  }

  async bytecodes() {
    if (!this.bytecodesRef) {
      const { bytes } = await this.vm.send(new Bytecodes({
        refType: this.declaringType.ref,
        methodID: this.ref,
      }));
      this.bytecodesRef = bytes;
    }
    return this.bytecodesRef;
  }
}

exports.createMethod = function(vm, declaringType, ref, name, signature, genericSignature, modifiers) {
  if ((modifiers & (VMModifiers.NATIVE | VMModifiers.ABSTRACT)) !== 0) {
    return new NonConcreteMethod(vm, declaringType, ref, name, signature, genericSignature, modifiers);
  }
  return new ConcreteMethod(vm, declaringType, ref, name, signature, genericSignature, modifiers);
};
