'use strict';

const mm = require('mm');
const path = require('path');
const assert = require('assert');
const sleep = require('mz-modules/sleep');
const awaitEvent = require('await-event');
const { launcher } = require('../');
const IntegerValue = require('../lib/primitive_value/integer_value');

describe('test/index.test.js', () => {
  let vm;
  before(async () => {
    vm = await launcher.launch({
      mainClass: 'Test',
      vmArgs: [ '-Dfile.encoding=UTF-8', '-Xdebug', '-Xnoagent', '-Djava.compiler=NONE' ],
      classPaths: [ path.join(__dirname, 'fixtures') ],
    });
    await vm.ready();
  });
  after(async () => {
    await sleep(100);
    await vm.exit();
  });
  afterEach(mm.restore);

  it('should allClasses ok', async () => {
    const er = vm.eventRequestManager.createClassPrepareRequest();
    er.addClassFilter('Test');

    await er.enable();
    await vm.resume();
    await awaitEvent(er, 'event');
    await er.disable();

    let classes = await vm.classesByName('java.lang.String');

    for (const clazz of classes) {
      const superclass = await clazz.getSuperclass();
      assert(superclass.signature === 'Ljava/lang/Object;');

      const instances = await clazz.instances(1);
      assert(Array.isArray(instances) && instances.length === 1);
      const val = await instances[0].getValue();
      console.log(val);
      console.log(await clazz.getClassFileVersion());
      const constantPool = await clazz.getConstantPoolInfo();
      console.log(constantPool);

      console.log(await clazz.nestedTypes());
      const classLoader = await clazz.getClassLoader();
      assert(classLoader == null);

      const classObject = await clazz.getClassObject();
      const clz = await classObject.getReflectedType();
      assert(clazz === clz);

      const clz2 = await classObject.referenceType();
      assert(clz2.myName === 'java.lang.Class');

      let fields = await clazz.visibleFields();
      fields = fields.filter(field => field.name === 'serialVersionUID');
      assert(fields.length === 1);
      const values = await clazz.getValues(fields);
      assert(Array.isArray(values) && values.length === 1);
      assert(values[0].tag === 74);
      assert(values[0].value);
    }

    classes = await vm.classesByName('Test');
    assert(Array.isArray(classes) && classes.length === 1);
    const clazz = classes[0];
    let locations = await clazz.locationsOfLine(15);
    if (locations.length) {
      const er = vm.eventRequestManager.createBreakpointRequest(locations[0]);
      er.suspendPolicy = 1;
      await er.enable();
    }
    locations = await clazz.locationsOfLine(6);
    if (locations.length) {
      const er = vm.eventRequestManager.createBreakpointRequest(locations[0]);
      er.suspendPolicy = 1;
      await er.enable();
    }
    await vm.resume();

    let breakpointEvent;
    do {
      const { events } = await awaitEvent(vm, 'event');
      for (const event of events) {
        console.log(event);
        if (event.eventKind === 'BREAKPOINT') {
          breakpointEvent = event;
          break;
        }
      }
    } while (!breakpointEvent);

    await vm.eventRequestManager.deleteAllBreakpoints();

    let fields = await clazz.visibleFields();
    fields = fields.filter(field => field.name === 'name');
    assert(fields.length === 1);

    let values = await clazz.getValues(fields);
    assert(Array.isArray(values) && values.length === 1);
    assert(values[0].tag === 115);
    assert(values[0].value);

    const strObj = await vm.createString('hello jdwp');
    console.log(await strObj.getValue());

    await clazz.setValue(fields[0], {
      tag: 115,
      value: strObj.ref,
    });

    values = await clazz.getValues(fields);
    assert(Array.isArray(values) && values.length === 1);
    console.log(values);

    console.log(breakpointEvent);

    let thread = vm.thread(breakpointEvent.thread);
    const threadName = await thread.getName();
    const threadStatus = await thread.getStatus();
    const frameCount = await thread.frameCount();
    console.log('threadName', threadName, frameCount, threadStatus);

    let methods = await clazz.methodsByName('plus');
    assert(Array.isArray(methods) && methods.length === 1);
    let method = methods[0];
    const args = [
      new IntegerValue(vm, 100),
      new IntegerValue(vm, 200),
    ];
    let returnValue = await clazz.invokeMethod(thread, method, args, 0);
    console.log(returnValue);
    assert(returnValue && returnValue.value === 300);

    methods = await clazz.getMethods();
    const ctos = [];
    for (const method of methods) {
      if (method.isConstructor) {
        ctos.push(method);
      }
    }
    assert(Array.isArray(ctos) && ctos.length === 1);

    const { tag, objectId } = await clazz.newInstance(thread, ctos[0], [], 0);
    const instance = vm.objectMirror(objectId, tag);
    returnValue = await instance.invokeMethod(thread, method, args, 0);
    console.log(returnValue);
    assert(returnValue && returnValue.value === 300);

    methods = await clazz.methodsByName('sayHello');
    assert(Array.isArray(methods) && methods.length === 1);
    method = methods[0];

    returnValue = await instance.invokeMethod(thread, method, [
      await vm.createString('world'),
    ], 0);
    console.log(returnValue);
    const resultObj = vm.objectMirror(returnValue.value, returnValue.tag);
    let re = await resultObj.getValue();
    assert(re === 'hello world');

    const idField = await clazz.fieldByName('id');
    assert(idField);
    let idVal = await instance.getValue(idField);
    let idObj = vm.objectMirror(idVal.value, idVal.tag);
    re = await idObj.getValue();
    assert(re === 'myId');

    const nameField = await clazz.fieldByName('name');
    assert(nameField);
    const nameVal = await instance.getValue(nameField);
    const nameObj = vm.objectMirror(nameVal.value, nameVal.tag);
    re = await nameObj.getValue();
    assert(re === 'hello jdwp');

    let newStr = await vm.createString('newId');
    await instance.setValue(idField, {
      tag: 115,
      value: newStr.ref,
    });
    idVal = await instance.getValue(idField);
    idObj = vm.objectMirror(idVal.value, idVal.tag);
    re = await idObj.getValue();
    assert(re === 'newId');


    newStr = await vm.createString('This is JDWP powered by Node.js');
    await instance.setValue(nameField, {
      tag: 115,
      value: newStr.ref,
    });

    const monitorInfo = await instance.monitorInfo();
    console.log(monitorInfo);

    await instance.disableCollection();
    await instance.enableCollection();

    console.log(await instance.isCollected());

    const referringObjects = await newStr.referringObjects(10);
    assert(Array.isArray(referringObjects) && referringObjects.length === 1);
    assert(referringObjects[0].ref = instance.ref);
    // assert(values[0].tag === 76);
    // assert(values[0].value == null);

    // values = await clazz.getValues(fields);
    // assert(Array.isArray(values) && values.length === 1);
    // assert(values[0].tag === 74);
    // assert(values[0].value.toString() === '1000000000000000000');

    locations = await clazz.locationsOfLine(6);
    if (locations.length) {
      const er = vm.eventRequestManager.createBreakpointRequest(locations[0]);
      er.suspendPolicy = 1;
      await er.enable();
    }
    vm.resume();

    breakpointEvent = null;
    do {
      const { events } = await awaitEvent(vm, 'event');
      for (const event of events) {
        if (event.eventKind === 'BREAKPOINT') {
          breakpointEvent = event;
          break;
        }
      }
    } while (!breakpointEvent);

    thread = vm.thread(breakpointEvent.thread);
    await thread.forceEarlyReturn(new IntegerValue(vm, 1000));

    await vm.resume();
  });
});
