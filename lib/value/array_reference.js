'use strict';

const {
  Length,
  GetValues,
  SetValues,
} = require('../command').ArrayReference;
const Value = require('../value');
const Tag = require('../command/const/tag');
const { isObjectTag } = require('../utils');
const ObjectReference = require('./object_reference');
const ByteValue = require('../primitive_value/byte_value');
const CharValue = require('../primitive_value/char_value');
const FloatValue = require('../primitive_value/float_value');
const DoubleValue = require('../primitive_value/double_value');
const IntegerValue = require('../primitive_value/integer_value');
const LongValue = require('../primitive_value/long_value');
const ShortValue = require('../primitive_value/short_value');
const BooleanValue = require('../primitive_value/boolean_value');
const VoidValue = require('./void_value');

class ArrayReference extends ObjectReference {
  constructor(vm, ref) {
    super(vm, ref);
    this.length = -1;
  }

  get typeValueKey() { return 91; }

  async getLength() {
    if (this.length === -1) {
      const { arrayLength } = await this.vm.send(new Length(this.ref));
      this.length = arrayLength;
    }
    return this.length;
  }

  async validateArrayAccess(index, length) {
    // because length can be computed from index,
    // index must be tested first for correct error message
    const len = await this.getLength();
    if ((index < 0) || (index > len)) {
      throw new Error('Invalid array index: ' + index);
    }
    if (length < 0) {
      throw new Error('Invalid array range length: ' + length);
    }
    if (index + length > len) {
      throw new Error('Invalid array range: ' + index + ' to ' + (index + length - 1));
    }
  }

  async getValue(index) {
    const list = await this.getValues(index, 1);
    return list[0];
  }

  async getValues(index, length) {
    if (length === -1) {
      length = await this.getLength() - index;
    }
    await this.validateArrayAccess(index, length);
    if (length === 0) {
      return [];
    }
    const { tag, values } = await this.vm.send(new GetValues({
      arrayObject: this.ref,
      firstIndex: index,
      length,
    }));
    return values.map(v => {
      if (isObjectTag(tag)) {
        return this.vm.objectMirror(v, tag);
      }
      switch (tag) {
        case Tag.BYTE:
          return new ByteValue(this.vm, v);
        case Tag.CHAR:
          return new CharValue(this.vm, v);
        case Tag.FLOAT:
          return new FloatValue(this.vm, v);
        case Tag.DOUBLE:
          return new DoubleValue(this.vm, v);
        case Tag.INT:
          return new IntegerValue(this.vm, v);

        case Tag.LONG:
          return new LongValue(this.vm, v);
        case Tag.SHORT:
          return new ShortValue(this.vm, v);
        case Tag.BOOLEAN:
          return new BooleanValue(this.vm, v);
        case Tag.VOID:
          return new VoidValue(this.vm);
        default:
          throw new Error('unknown tag: ' + tag);
      }
    });
  }

  async setValue(index, value) {
    const list = [ value ];
    return await this.setValues(index, list, 0, 1);
  }

  async setValues(index, values, srcIndex, length) {
    if (length === -1) {
      const len = await this.getLength();
      length = Math.min(len - index, values.length - srcIndex);
    }
    await this.validateArrayAccess(index, length);

    if ((srcIndex < 0) || (srcIndex > values.length)) {
      throw new Error('Invalid source index: ' + srcIndex);
    }
    if (srcIndex + length > values.length) {
      throw new Error('Invalid source range: ' + srcIndex + ' to ' + (srcIndex + length - 1));
    }

    const setValues = [];
    const arrayType = await this.getType();
    const componentType = await arrayType.componentType();
    const componentTypeName = await arrayType.getComponentTypeName();
    const componentSignature = await arrayType.getComponentSignature();

    for (let i = 0; i < length; i++) {
      const value = values[0];
      setValues.push(await Value.prepareForAssignment(value, {
        signature: componentSignature,
        typeName: componentTypeName,
        type: componentType,
      }));
    }

    await this.vm.send(new SetValues({
      arrayObject: this.ref,
      firstIndex: index,
      values: setValues,
    }));
  }
}

module.exports = ArrayReference;
