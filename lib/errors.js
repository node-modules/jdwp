'use strict';

const errorMap = {
  10: {
    name: 'INVALID_THREAD',
    message: 'Passed thread is null, is not a valid thread or has exited.',
  },
  11: {
    name: 'INVALID_THREAD_GROUP',
    message: 'Thread group invalid.',
  },
  12: {
    name: 'INVALID_PRIORITY',
    message: 'Invalid priority.',
  },
  13: {
    name: 'THREAD_NOT_SUSPENDED',
    message: 'If the specified thread has not been suspended by an event.',
  },
  14: {
    name: 'THREAD_SUSPENDED',
    message: 'Thread already suspended.',
  },
  15: {
    name: 'THREAD_NOT_ALIVE',
    message: 'Thread has not been started or is now dead.',
  },
  20: {
    name: 'INVALID_OBJECT',
    message: 'If this reference type has been unloaded and garbage collected.',
  },
  21: {
    name: 'INVALID_CLASS',
    message: 'Invalid class.',
  },
  22: {
    name: 'CLASS_NOT_PREPARED',
    message: 'Class has been loaded but not yet prepared.',
  },
  23: {
    name: 'INVALID_METHODID',
    message: 'Invalid method.',
  },
  24: {
    name: 'INVALID_LOCATION',
    message: 'Invalid location.',
  },
  25: {
    name: 'INVALID_FIELDID',
    message: 'Invalid field.',
  },
  30: {
    name: 'INVALID_FRAMEID',
    message: 'Invalid jframeID.',
  },
  31: {
    name: 'NO_MORE_FRAMES',
    message: 'There are no more Java or JNI frames on the call stack.',
  },
  32: {
    name: 'OPAQUE_FRAME',
    message: 'Information about the frame is not available.',
  },
  33: {
    name: 'NOT_CURRENT_FRAME',
    message: 'Operation can only be performed on current frame.',
  },
  34: {
    name: 'TYPE_MISMATCH',
    message: 'The variable is not an appropriate type for the function used.',
  },
  35: {
    name: 'INVALID_SLOT',
    message: 'Invalid slot.',
  },
  40: {
    name: 'DUPLICATE',
    message: 'Item already set.',
  },
  41: {
    name: 'NOT_FOUND',
    message: 'Desired element not found.',
  },
  50: {
    name: 'INVALID_MONITOR',
    message: 'Invalid monitor.',
  },
  51: {
    name: 'NOT_MONITOR_OWNER',
    message: 'This thread doesn\'t own the monitor.',
  },
  52: {
    name: 'INTERRUPT',
    message: 'The call has been interrupted before completion.',
  },
  60: {
    name: 'INVALID_CLASS_FORMAT',
    message: 'The virtual machine attempted to read a class file and determined that the file is malformed or otherwise cannot be interpreted as a class file.',
  },
  61: {
    name: 'CIRCULAR_CLASS_DEFINITION',
    message: 'A circularity has been detected while initializing a class.',
  },
  62: {
    name: 'FAILS_VERIFICATION',
    message: 'The verifier detected that a class file, though well formed, contained some sort of internal inconsistency or security problem.',
  },
  63: {
    name: 'ADD_METHOD_NOT_IMPLEMENTED',
    message: 'Adding methods has not been implemented.',
  },
  64: {
    name: 'SCHEMA_CHANGE_NOT_IMPLEMENTED',
    message: 'Schema change has not been implemented.',
  },
  65: {
    name: 'INVALID_TYPESTATE',
    message: 'The state of the thread has been modified, and is now inconsistent.',
  },
  66: {
    name: 'HIERARCHY_CHANGE_NOT_IMPLEMENTED',
    message: 'A direct superclass is different for the new class version, or the set of directly implemented interfaces is different and canUnrestrictedlyRedefineClasses is false.',
  },
  67: {
    name: 'DELETE_METHOD_NOT_IMPLEMENTED',
    message: 'The new class version does not declare a method declared in the old class version and canUnrestrictedlyRedefineClasses is false.',
  },
  68: {
    name: 'UNSUPPORTED_VERSION',
    message: 'A class file has a version number not supported by this VM.',
  },
  69: {
    name: 'NAMES_DONT_MATCH',
    message: 'The class name defined in the new class file is different from the name in the old class object.',
  },
  70: {
    name: 'CLASS_MODIFIERS_CHANGE_NOT_IMPLEMENTED',
    message: 'The new class version has different modifiers and and canUnrestrictedlyRedefineClasses is false.',
  },
  71: {
    name: 'METHOD_MODIFIERS_CHANGE_NOT_IMPLEMENTED',
    message: 'A method in the new class version has different modifiers than its counterpart in the old class version and and canUnrestrictedlyRedefineClasses is false.',
  },
  99: {
    name: 'NOT_IMPLEMENTED',
    message: 'The functionality is not implemented in this virtual machine.',
  },
  100: {
    name: 'NULL_POINTER',
    message: 'Invalid pointer.',
  },
  101: {
    name: 'ABSENT_INFORMATION',
    message: 'Desired information is not available.',
  },
  102: {
    name: 'INVALID_EVENT_TYPE',
    message: 'The specified event type id is not recognized.',
  },
  103: {
    name: 'ILLEGAL_ARGUMENT',
    message: 'Illegal argument.',
  },
  110: {
    name: 'OUT_OF_MEMORY',
    message: 'The function needed to allocate memory and no more memory was available for allocation.',
  },
  111: {
    name: 'ACCESS_DENIED',
    message: 'Debugging has not been enabled in this virtual machine. JVMTI cannot be used.',
  },
  112: {
    name: 'VM_DEAD',
    message: 'The virtual machine is not running.',
  },
  113: {
    name: 'INTERNAL',
    message: 'An unexpected internal error has occurred.',
  },
  115: {
    name: 'UNATTACHED_THREAD',
    message: 'The thread being used to call this function is not attached to the virtual machine. Calls must be made from attached threads.',
  },
  500: {
    name: 'INVALID_TAG',
    message: 'object type id or class tag.',
  },
  502: {
    name: 'ALREADY_INVOKING',
    message: 'Previous invoke not complete.',
  },
  503: {
    name: 'INVALID_INDEX',
    message: 'Index is invalid.',
  },
  504: {
    name: 'INVALID_LENGTH',
    message: 'The length is invalid.',
  },
  506: {
    name: 'INVALID_STRING',
    message: 'The string is invalid.',
  },
  507: {
    name: 'INVALID_CLASS_LOADER',
    message: 'The class loader is invalid.',
  },
  508: {
    name: 'INVALID_ARRAY',
    message: 'The array is invalid.',
  },
  509: {
    name: 'TRANSPORT_LOAD',
    message: 'Unable to load the transport.',
  },
  510: {
    name: 'TRANSPORT_INIT',
    message: 'Unable to initialize the transport.',
  },
  511: {
    name: 'NATIVE_METHOD',
    message: '',
  },
  512: {
    name: 'INVALID_COUNT',
    message: 'The count is invalid.',
  },
};

module.exports = errorCode => {
  // No error has occurred.
  if (errorCode === 0) return;

  const info = errorMap[errorCode];
  let err;
  if (info) {
    err = new Error(info.message);
    err.name = info.name;
  } else {
    err = new Error('unknow error: ' + errorCode);
  }
  err.code = errorCode;
  throw err;
};
