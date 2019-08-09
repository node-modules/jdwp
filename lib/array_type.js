'use strict';

const { isObjectTag } = require('./utils');
const ReferenceType = require('./reference_type');
const JNITypeParser = require('./jni_type_parser');
const { NewInstance } = require('./command').ArrayType;
const PrimitiveType = require('./primitive_type');

class ArrayType extends ReferenceType {
  get typeTag() {
    return 3;
  }

  async getComponentSignature() {
    const signature = await this.getSignature();
    return signature.slice(1); // Just skip the leading '['
  }

  async getComponentTypeName() {
    const parser = new JNITypeParser(await this.getComponentSignature());
    return parser.typeName;
  }

  async findComponentType(signature) {
    const tag = signature.charCodeAt(0);
    if (isObjectTag(tag)) {
      const parser = new JNITypeParser(await this.getComponentSignature());
      const list = await this.vm.classesByName(parser.typeName);
      const cl1 = await this.getClassLoader();
      for (const type of list) {
        const cl2 = await type.getClassLoader();
        if (cl2) {
          if (cl2.equals(cl1)) return type;
        } else {
          if (!cl1) return type;
        }
      }
      throw new Error(await this.getComponentTypeName() + ' class not loaded');
    }
    return this.vm.primitiveType(tag);
  }

  async componentType() {
    return await this.findComponentType(await this.getComponentSignature());
  }

  async newInstance(length) {
    const { newArray } = await this.vm.send(new NewInstance({
      arrType: this.ref,
      length,
    }));
    return this.vm.objectMirror(newArray.objectId, newArray.tag);
  }

  async isComponentAssignable(destination, source) {
    if (source instanceof PrimitiveType) {
      return source.signature === destination.signature;
    }
    if (destination instanceof PrimitiveType) return false;

    return await source.isAssignableTo(destination);
  }

  async isAssignableTo(destType) {
    if (destType.typeTag === 3) {
      try {
        const destComponentType = await destType.componentType();
        return await this.isComponentAssignable(destComponentType, await this.componentType());
      } catch (err) {
        return false;
      }
    }
    const name = await destType.getName();
    // interface
    if (destType.typeTag === 2) {
      return name === 'java.lang.Cloneable';
    }
    return name === 'java.lang.Object';
  }
}

module.exports = ArrayType;
