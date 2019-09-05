'use strict';

const {
  VisibleClasses,
} = require('../command').ClassLoaderReference;
const JNITypeParser = require('../jni_type_parser');
const ObjectReference = require('./object_reference');

class ClassLoaderReference extends ObjectReference {
  async visibleClasses() {
    // TODO: cache
    const { classes } = await this.vm.send(new VisibleClasses(this.ref));
    return classes.map(c => this.vm.referenceType(c.typeID, c.refTypeTag));
  }

  async findType(signature) {
    const types = await this.visibleClasses();
    for (const type of types) {
      const sig = await type.getSignature();
      if (signature === sig) return type;
    }
    const parser = new JNITypeParser(signature);
    throw new Error('Class ' + parser.typeName + ' not loaded');
  }

  get typeValueKey() { return 108; }
}

module.exports = ClassLoaderReference;
