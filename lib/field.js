'use strict';

const VMModifiers = require('./command/const/vm_modifiers');
const TypeComponent = require('./type_component');

class Field extends TypeComponent {
  equals(field) {
    if (!field) return false;
    return this.declaringType.equals(field.declaringType) && this.ref === field.ref && this.vm === field.vm;
  }

  compareTo(field) {
    let rc = this.declaringType.compareTo(field.declaringType);
    if (rc === 0) {
      rc = this.declaringType.indexOf(this) - this.declaringType.indexOf(field);
    }
    return rc;
  }

  get isTransient() {
    return this.isModifierSet(VMModifiers.TRANSIENT);
  }

  get isVolatile() {
    return this.isModifierSet(VMModifiers.VOLATILE);
  }

  get isEnumConstant() {
    return this.isModifierSet(VMModifiers.ENUM_CONSTANT);
  }
}

module.exports = Field;
