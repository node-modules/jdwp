'use strict';

const Tag = require('./command/const/tag');

const SIGNATURE_ENDCLASS = ';';
const SIGNATURE_FUNC = '('.charCodeAt(0);
const SIGNATURE_ENDFUNC = ')'.charCodeAt(0);

class JNITypeParser {
  constructor(signature) {
    this.rawSignature = signature;
    this.typeNameList = [];
    this.signatureList = [];
    this.currentIndex = 0;

    while (this.currentIndex < signature.length) {
      const elem = this.nextTypeName();
      this.typeNameList.push(elem);
    }
    if (this.typeNameList.length === 0) {
      throw new Error('Invalid JNI signature "' + signature + '"');
    }

    this.currentIndex = 0;
    while (this.currentIndex < signature.length) {
      const elem = this.nextSignature();
      this.signatureList.push(elem);
    }
    if (this.signatureList.length === 0) {
      throw new Error('Invalid JNI signature "' + signature + '"');
    }
  }

  get typeName() {
    const list = this.typeNameList;
    return list[list.length - 1];
  }

  get argumentTypeNames() {
    return this.typeNameList.slice(0, this.typeNameList.length - 1);
  }

  get signature() {
    return this.signatureList[this.signatureList.length - 1];
  }

  get argumentSignatures() {
    return this.signatureList.slice(0, this.signatureList.length - 1);
  }

  nextTypeName() {
    const key = this.rawSignature.charCodeAt(this.currentIndex++);
    switch (key) {
      case Tag.ARRAY:
        return this.nextTypeName() + '[]';
      case Tag.BYTE:
        return 'byte';
      case Tag.CHAR:
        return 'char';
      case Tag.OBJECT:
      {
        const endClass = this.rawSignature.indexOf(SIGNATURE_ENDCLASS, this.currentIndex);
        let retVal = this.rawSignature.substring(this.currentIndex, endClass);
        retVal = retVal.replace(/\//g, '.');
        this.currentIndex = endClass + 1;
        return retVal;
      }
      case Tag.FLOAT:
        return 'float';
      case Tag.DOUBLE:
        return 'double';
      case Tag.INT:
        return 'int';
      case Tag.LONG:
        return 'long';
      case Tag.SHORT:
        return 'short';
      case Tag.VOID:
        return 'void';
      case Tag.BOOLEAN:
        return 'boolean';
      case SIGNATURE_ENDFUNC:
      case SIGNATURE_FUNC:
        return this.nextTypeName();
      default:
        throw new Error('Invalid JNI signature character "' + key + '"');
    }
  }

  nextSignature() {
    const key = this.rawSignature.charCodeAt(this.currentIndex++);
    switch (key) {
      case Tag.ARRAY:
        return key + this.nextSignature();
      case Tag.OBJECT:
      {
        const endClass = this.rawSignature.indexOf(SIGNATURE_ENDCLASS, this.currentIndex);
        const retVal = this.rawSignature.substring(this.currentIndex - 1, endClass + 1);
        this.currentIndex = endClass + 1;
        return retVal;
      }
      case Tag.VOID:
      case Tag.BOOLEAN:
      case Tag.BYTE:
      case Tag.CHAR:
      case Tag.SHORT:
      case Tag.INT:
      case Tag.LONG:
      case Tag.FLOAT:
      case Tag.DOUBLE:
        return String.fromCharCode(key);
      case SIGNATURE_ENDFUNC:
      case SIGNATURE_FUNC:
        return this.nextSignature();
      default:
        throw new Error('Invalid JNI signature character \'' + key + '\'');
    }
  }

  static typeNameToSignature(signature) {
    let name = '';
    const firstIndex = signature.indexOf('[');
    let index = firstIndex;
    while (index !== -1) {
      name += '[';
      index = signature.indexOf('[', index + 1);
    }
    if (firstIndex !== -1) {
      signature = signature.substring(0, firstIndex);
    }
    if (signature === 'boolean') {
      name += 'Z';
    } else if (signature === 'byte') {
      name += 'B';
    } else if (signature === 'char') {
      name += 'C';
    } else if (signature === 'short') {
      name += 'S';
    } else if (signature === 'int') {
      name += 'I';
    } else if (signature === 'long') {
      name += 'J';
    } else if (signature === 'float') {
      name += 'F';
    } else if (signature === 'double') {
      name += 'D';
    } else {
      name += 'L';
      name += signature.replace(/\./g, '/');
      name += ';';
    }
    return name;
  }
}

module.exports = JNITypeParser;
