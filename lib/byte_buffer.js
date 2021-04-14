'use strict';

const Long = require('long');
const utility = require('utility');
const { isObjectTag } = require('./utils');

const DEFAULT_SIZE = 1024;
const MAX_INT_31 = Math.pow(2, 31);

let fieldIDSize = 8;
let methodIDSize = 8;
let objectIDSize = 8;
let referenceTypeIDSize = 8;
let frameIDSize = 8;

let nullObjectID = Buffer.alloc(objectIDSize, 0).toString('hex');
let nullReferenceTypeID = Buffer.alloc(referenceTypeIDSize, 0).toString('hex');

class ByteBuffer {
  constructor(options = {}) {
    this._size = options.size || DEFAULT_SIZE;
    this._offset = 0;
    this._limit = this._size;
    const buf = options.buf;
    if (buf) {
      this._bytes = buf;
    } else {
      this._bytes = Buffer.alloc(this._size);
    }
  }

  get capacity() {
    return this._size;
  }

  reset() {
    this._offset = 0;
  }

  clear() {
    this._limit = this._size;
    this._offset = 0;
    this._bytes = Buffer.alloc(this._size);
    return this;
  }

  copy(start = 0, end = this._offset) {
    if (end > this._offset) {
      end = this._offset;
    }
    const buf = Buffer.alloc(end - start);
    this._bytes.copy(buf, 0, start, end);
    return buf;
  }

  skip(size) {
    this._offset += size;
  }

  limit(newLimit) {
    if (typeof newLimit === 'number') {
      if ((newLimit < 0) || (newLimit > this._size)) {
        throw new Error('IllegalArgumentException');
      }
      if (this._offset > newLimit) {
        this._offset = newLimit;
      }
      this._limit = newLimit;
      return this;
    }
    return this._limit;
  }

  flip() {
    // switch to read mode
    this.limit(this.position());
    this.position(0);
    return this;
  }

  remaining() {
    return this.limit() - this.position();
  }

  hasRemaining() {
    return this.remaining() > 0;
  }

  position(newPosition) {
    if (typeof newPosition === 'number') {
      this._offset = newPosition;
      // make `bytes.position(1).read();` chain
      return this;
    }
    return this._offset;
  }

  _checkSize(afterSize) {
    if (this._size >= afterSize) {
      return;
    }
    this._size = afterSize * 2;
    this._limit = this._size;
    const bytes = Buffer.alloc(this._size);
    this._bytes.copy(bytes, 0);
    this._bytes = bytes;
  }

  //
  getByte(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += 1;
    }
    return this._bytes[index];
  }

  getBytes(index, size) {
    if (typeof size !== 'number') {
      size = index;
      index = this._offset;
      this._offset += size;
    }
    return this._bytes.slice(index, index + size);
  }

  getBoolean(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += 1;
    }
    return this._bytes[index] !== 0;
  }

  getInt(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += 4;
    }
    return this._bytes.readInt32BE(index);
  }

  getLong(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += 8;
    }
    return new Long(
      this._bytes.readInt32BE(index + 4), // low, high
      this._bytes.readInt32BE(index)
    );
  }

  getString(index) {
    let moveOffset = false;
    if (index === null || index === undefined) {
      index = this._offset;
      moveOffset = true;
    }
    const length = this.getInt(index);
    index += 4;

    if (moveOffset) {
      this._offset += 4 + length;
    }
    if (length === 0) {
      // empty string
      return '';
    }
    return this._bytes.toString('utf8', index, index + length);
  }

  getObjectID(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += objectIDSize;
    }
    const ret = this._bytes.slice(index, index + objectIDSize).toString('hex');
    return ret === nullObjectID ? null : ret;
  }

  getClassLoaderID(index) {
    return this.getObjectID(index);
  }

  getReferenceTypeID(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += referenceTypeIDSize;
    }
    const ret = this._bytes.slice(index, index + referenceTypeIDSize).toString('hex');
    return ret === nullReferenceTypeID ? null : ret;
  }

  getThreadID(index) {
    return this.getObjectID(index);
  }

  getThreadGroupID(index) {
    return this.getObjectID(index);
  }

  getClassID(index) {
    return this.getReferenceTypeID(index);
  }

  getMethodID(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += methodIDSize;
    }
    return this._bytes.slice(index, index + methodIDSize).toString('hex');
  }

  getClassObjectID(index) {
    return this.getObjectID(index);
  }

  getLocation(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += (1 + objectIDSize + methodIDSize + 8);
    }
    // TypeTag: CLASS | INTERFACE | ARRAY
    // classID: 8-bytes
    // methodID: 8-bytes
    // index:  unsigned 8-bytes
    const typeTag = this.getByte(index);
    const classID = this.getClassID(index + 1);
    const methodID = this.getMethodID(index + 1 + objectIDSize);
    const i = Long.fromBytesBE(this._bytes.slice(index + 1 + objectIDSize + methodIDSize, index + 1 + objectIDSize + methodIDSize + 8), true);
    return {
      typeTag,
      classID,
      methodID,
      index: i.compare(Number.MAX_SAFE_INTEGER) < 0 ? i.toInt() : i,
    };
  }

  getTaggedObjectID(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += (1 + objectIDSize);
    }
    const tag = this.getByte(index);
    const objectId = this.getObjectID(index + 1);
    return {
      // https://docs.oracle.com/javase/7/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_Tag
      tag,
      objectId,
    };
  }

  getFieldID(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += fieldIDSize;
    }
    return this._bytes.slice(index, index + fieldIDSize).toString('hex');
  }

  getFrameID(index) {
    if (typeof index !== 'number') {
      index = this._offset;
      this._offset += frameIDSize;
    }
    return this._bytes.slice(index, index + frameIDSize).toString('hex');
  }

  getInterfaceID(index) {
    return this.getReferenceTypeID(index);
  }

  getValue(index) {
    let moveOffset = false;
    if (typeof index !== 'number') {
      index = this._offset;
      moveOffset = true;
    }

    const tag = this.getByte(index);
    let len;
    let value;
    switch (tag) {
      case 91: // ARRAY
      case 76: // OBJECT
      case 115: // STRING
      case 116: // THREAD
      case 103: // THREAD_GROUP
      case 108: // CLASS_LOADER
      case 99: // CLASS_OBJECT
        len = 8;
        value = this.getObjectID(index + 1);
        break;
      case 66: // BYTE
        len = 1;
        value = this.getByte(index + 1);
        break;
      case 67: // CHAR
        len = 2;
        value = String.fromCharCode(this._bytes.readInt16BE(index + 1));
        break;
      case 70: // FLOAT
        len = 4;
        value = this._bytes.readFloatBE(index + 1);
        break;
      case 68: // DOUBLE
        len = 8;
        value = this._bytes.readDoubleBE(index + 1);
        break;
      case 73: // INT
        len = 4;
        value = this._bytes.readInt32BE(index + 1);
        break;
      case 74: // LONG
        len = 8;
        value = new Long(
          this._bytes.readInt32BE(index + 5), // low, high
          this._bytes.readInt32BE(index + 1)
        );
        break;
      case 83: // SHORT
        len = 2;
        value = this._bytes.readInt16BE(index + 1);
        break;
      case 86: // VOID
        len = 0;
        value = undefined;
        break;
      case 90: // BOOLEAN
        len = 1;
        value = this.getByte(index + 1) === 1;
        break;
      default:
        break;
    }
    if (moveOffset) {
      this._offset += (len + 1);
    }
    return {
      tag,
      value,
    };
  }

  _getUntaggedValue(index, tag) {
    let len;
    let value;
    switch (tag) {
      case 91: // ARRAY
      case 76: // OBJECT
      case 115: // STRING
      case 116: // THREAD
      case 103: // THREAD_GROUP
      case 108: // CLASS_LOADER
      case 99: // CLASS_OBJECT
        len = 8;
        value = this.getObjectID(index);
        break;
      case 66: // BYTE
        len = 1;
        value = this.getByte(index);
        break;
      case 67: // CHAR
        len = 2;
        value = String.fromCharCode(this._bytes.readInt16BE(index));
        break;
      case 70: // FLOAT
        len = 4;
        value = this._bytes.readFloatBE(index);
        break;
      case 68: // DOUBLE
        len = 8;
        value = this._bytes.readDoubleBE(index);
        break;
      case 73: // INT
        len = 4;
        value = this._bytes.readInt32BE(index);
        break;
      case 74: // LONG
        len = 8;
        value = new Long(
          this._bytes.readInt32BE(index + 4), // low, high
          this._bytes.readInt32BE(index)
        );
        break;
      case 83: // SHORT
        len = 2;
        value = this._bytes.readInt16BE(index);
        break;
      case 86: // VOID
        len = 0;
        value = undefined;
        break;
      case 90: // BOOLEAN
        len = 1;
        value = this.getByte(index) === 1;
        break;
      default:
        break;
    }
    return { value, len };
  }

  // TODO this is broken for arrays of objects when the array has null references and makes the tag = 0
  getArrayRegion(index) {
    let moveOffset = false;
    if (typeof index !== 'number') {
      index = this._offset;
      moveOffset = true;
    }
    let tag = this.getByte(index);
    const isObject = isObjectTag(tag);
    const size = this.getInt(index + 1);
    const values = [];
    let offset = index + 1 + 4;
    for (let i = 0; i < size; i++) {
      if (isObject) {
        const result = this.getValue(offset);
        offset += 8;
        tag = result.tag;
        values.push(result.value);
      } else {
        const { value, len } = this._getUntaggedValue(offset, tag);
        offset += len;
        values.push(value);
      }
    }
    if (moveOffset) {
      this._offset = offset;
    }
    return { tag, values };
  }

  //
  put(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += value.length;
      this._checkSize(this._offset);
    }
    value.copy(this._bytes, index, this._offset, 0, value.length);
    return this;
  }

  putByte(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += 1;
      this._checkSize(this._offset);
    }
    this._bytes[index] = value;
    return this;
  }

  putFieldID(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += fieldIDSize;
      this._checkSize(this._offset);
    }
    this._bytes.write(value, index, fieldIDSize, 'hex');
    return this;
  }

  putObjectID(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += objectIDSize;
      this._checkSize(this._offset);
    }
    this._bytes.write(value, index, objectIDSize, 'hex');
    return this;
  }

  putClassObjectID(index, value) {
    return this.putObjectID(index, value);
  }

  putClassLoaderID(index, value) {
    return this.putObjectID(index, value);
  }

  putThreadID(index, value) {
    return this.putObjectID(index, value);
  }

  putThreadGroupID(index, value) {
    return this.putObjectID(index, value);
  }

  putClassID(index, value) {
    return this.putReferenceTypeID(index, value);
  }

  putMethodID(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += methodIDSize;
      this._checkSize(this._offset);
    }
    this._bytes.write(value, index, methodIDSize, 'hex');
    return this;
  }

  putReferenceTypeID(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += referenceTypeIDSize;
      this._checkSize(this._offset);
    }
    this._bytes.write(value, index, referenceTypeIDSize, 'hex');
    return this;
  }

  putFrameID(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += frameIDSize;
      this._checkSize(this._offset);
    }
    this._bytes.write(value, index, frameIDSize, 'hex');
    return this;
  }

  putInt(index, value) {
    if (value === undefined) {
      value = index;
      index = this._offset;
      this._offset += 4;
      this._checkSize(this._offset);
    }
    this._bytes.writeInt32BE(value, index);
    return this;
  }

  putString(index, value) {
    if (typeof value === 'undefined') {
      value = index;
      index = null;
    }
    if (!value || value.length === 0) {
      // empty string
      if (index === null || index === undefined) {
        index = this._offset;
        this._offset += 4;
        this._checkSize(this._offset);
      } else {
        this._checkSize(index + 4);
      }
      return this.putInt(index, 0);
    }

    const isBuffer = Buffer.isBuffer(value);
    const length = isBuffer ?
      value.length :
      Buffer.byteLength(value);

    if (index === null || index === undefined) {
      index = this._offset;
      this._offset += length + 4;
      this._checkSize(this._offset);
    } else {
      this._checkSize(index + length + 4);
    }
    this.putInt(index, length);
    const valueOffset = index + 4;

    if (isBuffer) {
      value.copy(this._bytes, valueOffset);
    } else {
      this._bytes.write(value, valueOffset);
    }
    return this;
  }

  _putFF(index) {
    this._bytes[index] = 0xff;
    this._bytes[index + 1] = 0xff;
    this._bytes[index + 2] = 0xff;
    this._bytes[index + 3] = 0xff;
  }

  _putZero(index) {
    this._bytes[index] = 0;
    this._bytes[index + 1] = 0;
    this._bytes[index + 2] = 0;
    this._bytes[index + 3] = 0;
  }

  putLong(index, value) {
    // long
    // int, long
    let offset = 0;
    if (value === undefined) {
      // long
      offset = this._offset;
      this._offset += 8;
      this._checkSize(this._offset);
      value = index;
    } else {
      // int, long
      offset = index;
    }

    // get the offset
    const highOffset = offset;
    const lowOffset = offset + 4;
    let isNumber = typeof value === 'number';
    // convert safe number string to number
    if (!isNumber && utility.isSafeNumberString(value)) {
      isNumber = true;
      value = Number(value);
    }

    // int
    if (isNumber &&
      value < MAX_INT_31 &&
      value >= -MAX_INT_31) {
      // put high
      value < 0 ?
        this._putFF(highOffset) :
        this._putZero(highOffset);
      this._bytes.writeInt32BE(value, lowOffset);
      return this;
    }

    // long number or string, make it a Long Object
    // TODO: Long object's performence has big problem
    if (typeof value.low !== 'number' ||
      typeof value.high !== 'number') {
      // not Long instance, must be Number or String
      value = isNumber ?
        Long.fromNumber(value) :
        Long.fromString(value);
    }

    // write
    this._bytes.writeInt32BE(value.high, highOffset);
    this._bytes.writeInt32BE(value.low, lowOffset);
    return this;
  }

  putLocation(index, value) {
    if (value === undefined) {
      // index, value
      value = index;
      index = this._offset;
      this._offset += (1 + referenceTypeIDSize + methodIDSize + 8);
      this._checkSize(this._offset);
    }

    const declaringType = value.declaringType;
    const typeTag = declaringType.typeTag;
    if (!typeTag) {
      throw new Error('Invalid Location');
    }

    this.putByte(index, typeTag);
    this.putClassID(index + 1, declaringType.ref);
    this.putMethodID(index + 1 + referenceTypeIDSize, value.method.ref);
    this.putLong(index + 1 + referenceTypeIDSize + methodIDSize, value.codeIndex);
    return this;
  }

  putUntaggedValue(index, val) {
    let moveOffset = false;
    if (val === undefined) {
      // index, value
      val = index;
      index = this._offset;
      this._checkSize(index + 8);
      moveOffset = true;
    }
    const { tag, value } = val;
    let len = 0;
    switch (tag) {
      case 91: // ARRAY
      case 76: // OBJECT
      case 115: // STRING
      case 116: // THREAD
      case 103: // THREAD_GROUP
      case 108: // CLASS_LOADER
      case 99: // CLASS_OBJECT
        len = objectIDSize;
        this.putObjectID(index, value);
        break;
      case 66: // BYTE
        len = 1;
        this.putByte(index, value);
        break;
      case 67: // CHAR
        len = 1;
        this.putByte(index, typeof value === 'string' ? value.charCodeAt(0) : value);
        break;
      case 70: // FLOAT
        len = 4;
        this._bytes.writeFloatBE(value, index);
        break;
      case 68: // DOUBLE
        len = 8;
        this._bytes.writeDoubleBE(value, index);
        break;
      case 73: // INT
        len = 4;
        this._bytes.writeInt32BE(value, index);
        break;
      case 74: // LONG
        len = 8;
        this.putLong(index, value);
        break;
      case 83: // SHORT
        len = 2;
        this._bytes.writeInt16BE(value, index);
        break;
      case 86: // VOID
        len = 0;
        break;
      case 90: // BOOLEAN
        len = 1;
        this.putByte(index, value ? 1 : 0);
        break;
      default:
        break;
    }
    if (moveOffset) {
      this._offset += len;
    }
    return this;
  }

  putValue(index, val) {
    let moveOffset = false;
    if (val === undefined) {
      // index, value
      val = index;
      index = this._offset;
      this._checkSize(index + 9);
      moveOffset = true;
    }
    const { tag, value } = val;
    let len = 0;
    this.putByte(index, tag);
    switch (tag) {
      case 91: // ARRAY
      case 76: // OBJECT
      case 115: // STRING
      case 116: // THREAD
      case 103: // THREAD_GROUP
      case 108: // CLASS_LOADER
      case 99: // CLASS_OBJECT
        len = objectIDSize;
        this.putObjectID(index + 1, value);
        break;
      case 66: // BYTE
        len = 1;
        this.putByte(index + 1, value);
        break;
      case 67: // CHAR
        len = 1;
        this.putByte(index + 1, typeof value === 'string' ? value.charCodeAt(0) : value);
        break;
      case 70: // FLOAT
        len = 4;
        this._bytes.writeFloatBE(value, index + 1);
        break;
      case 68: // DOUBLE
        len = 8;
        this._bytes.writeDoubleBE(value, index + 1);
        break;
      case 73: // INT
        len = 4;
        this._bytes.writeInt32BE(value, index + 1);
        break;
      case 74: // LONG
        len = 8;
        this.putLong(index + 1, value);
        break;
      case 83: // SHORT
        len = 2;
        this._bytes.writeInt16BE(value, index + 1);
        break;
      case 86: // VOID
        len = 0;
        break;
      case 90: // BOOLEAN
        len = 1;
        this.putByte(index + 1, value ? 1 : 0);
        break;
      default:
        break;
    }
    if (moveOffset) {
      this._offset += (len + 1);
    }
    return this;
  }

  static allocate(capacity) {
    return new ByteBuffer({ size: capacity });
  }

  static wrap(buf, offset, length) {
    if (offset) {
      const end = offset + (length || buf.length);
      buf = buf.slice(offset, end);
    }
    return new ByteBuffer({ buf, size: buf.length });
  }

  static setFieldIDSize(val) {
    fieldIDSize = val;
  }

  static setMethodIDSize(val) {
    methodIDSize = val;
  }

  static setObjectIDSize(val) {
    objectIDSize = val;
    nullObjectID = Buffer.alloc(objectIDSize, 0).toString('hex');
  }

  static setReferenceTypeIDSize(val) {
    referenceTypeIDSize = val;
    nullReferenceTypeID = Buffer.alloc(referenceTypeIDSize, 0).toString('hex');
  }

  static setFrameIDSize(val) {
    frameIDSize = val;
  }

  static getFieldIDSize() {
    return fieldIDSize;
  }

  static getMethodIDSize() {
    return methodIDSize;
  }

  static getObjectIDSize() {
    return objectIDSize;
  }

  static getReferenceTypeIDSize() {
    return referenceTypeIDSize;
  }

  static getFrameIDSize() {
    return frameIDSize;
  }
}

module.exports = ByteBuffer;
