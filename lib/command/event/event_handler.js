'use strict';

const handlers = new Map();

function singleStep(data) {
  return {
    eventKind: 'SINGLE_STEP',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
  };
}
handlers.set(1, singleStep);

function breakpoint(data) {
  return {
    eventKind: 'BREAKPOINT',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
  };
}
handlers.set(2, breakpoint);

function exception(data) {
  return {
    eventKind: 'EXCEPTION',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
    exception: data.getTaggedObjectID(),
    catchLocation: data.getLocation(),
  };
}
handlers.set(4, exception);

function threadStart(data) {
  return {
    eventKind: 'THREAD_START',
    requestID: data.getInt(),
    thread: data.getThreadID(),
  };
}
handlers.set(6, threadStart);

function threadDeath(data) {
  return {
    eventKind: 'THREAD_DEATH',
    requestID: data.getInt(),
    thread: data.getThreadID(),
  };
}
handlers.set(7, threadDeath);

function classPrepare(data) {
  return {
    eventKind: 'CLASS_PREPARE',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    // https://docs.oracle.com/javase/7/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_TypeTag
    refTypeTag: data.getByte(),
    typeID: data.getReferenceTypeID(),
    signature: data.getString(),
    // https://docs.oracle.com/javase/7/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_ClassStatus
    status: data.getInt(),
  };
}
handlers.set(8, classPrepare);

function classUnload(data) {
  return {
    eventKind: 'CLASS_UNLOAD',
    requestID: data.getInt(),
    signature: data.getString(),
  };
}
handlers.set(9, classUnload);

function fieldAccess(data) {
  return {
    eventKind: 'FIELD_ACCESS',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
    // https://docs.oracle.com/javase/7/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_TypeTag
    refTypeTag: data.getByte(),
    typeID: data.getReferenceTypeID(),
    fieldID: data.getFieldID(),
    object: data.getTaggedObjectID(),
  };
}
handlers.set(20, fieldAccess);

function fieldModification(data) {
  return {
    eventKind: 'FIELD_MODIFICATION',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
    refTypeTag: data.getByte(),
    typeID: data.getReferenceTypeID(),
    fieldID: data.getFieldID(),
    object: data.getTaggedObjectID(),
    valueToBe: data.getValue(),
  };
}
handlers.set(21, fieldModification);

function methodEntry(data) {
  return {
    eventKind: 'METHOD_ENTRY',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
  };
}
handlers.set(40, methodEntry);

function methodExit(data) {
  return {
    eventKind: 'METHOD_EXIT',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
  };
}
handlers.set(41, methodExit);

function methodExitWithReturnValue(data) {
  return {
    eventKind: 'METHOD_EXIT_WITH_RETURN_VALUE',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    location: data.getLocation(),
    value: data.getValue(),
  };
}
handlers.set(42, methodExitWithReturnValue);

function monitorContendedEnter(data) {
  return {
    eventKind: 'MONITOR_CONTENDED_ENTER',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    object: data.getTaggedObjectID(),
    location: data.getLocation(),
  };
}
handlers.set(43, monitorContendedEnter);

function monitorContendedEntered(data) {
  return {
    eventKind: 'MONITOR_CONTENDED_ENTERED',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    object: data.getTaggedObjectID(),
    location: data.getLocation(),
  };
}
handlers.set(44, monitorContendedEntered);

function monitorWait(data) {
  return {
    eventKind: 'MONITOR_WAIT',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    object: data.getTaggedObjectID(),
    location: data.getLocation(),
    timeout: data.getLong(),
  };
}
handlers.set(45, monitorWait);

function monitorWaited(data) {
  return {
    eventKind: 'MONITOR_WAITED',
    requestID: data.getInt(),
    thread: data.getThreadID(),
    object: data.getTaggedObjectID(),
    location: data.getLocation(),
    timedout: data.getLong(),
  };
}
handlers.set(46, monitorWaited);

function vmStart(data) {
  return {
    eventKind: 'VM_START',
    requestID: data.getInt(),
    thread: data.getThreadID(),
  };
}
handlers.set(90, vmStart);

function vmDeath(data) {
  return {
    eventKind: 'VM_DEATH',
    requestID: data.getInt(),
  };
}
handlers.set(99, vmDeath);

module.exports = handlers;
