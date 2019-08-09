'use strict';

const mm = require('mm');
const path = require('path');
const assert = require('assert');
const sleep = require('mz-modules/sleep');
const awaitEvent = require('await-event');
const { launcher } = require('../');

describe('test/frame.test.js', () => {
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

  it('should ok', async () => {
    let er = vm.eventRequestManager.createClassPrepareRequest();
    er.addClassFilter('Test');

    await er.enable();
    await vm.resume();
    await awaitEvent(er, 'event');

    const classes = await vm.classesByName('Test');
    assert(Array.isArray(classes) && classes.length === 1);
    const clazz = classes[0];
    const locations = await clazz.locationsOfLine(15);
    assert(locations && locations.length === 1);
    er = vm.eventRequestManager.createBreakpointRequest(locations[0]);
    er.suspendPolicy = 1;
    await er.enable();

    vm.resume();

    let breakpointEvent;
    do {
      const { events } = await awaitEvent(vm, 'event');
      for (const event of events) {
        if (event.eventKind === 'BREAKPOINT') {
          breakpointEvent = event;
          break;
        }
      }
    } while (!breakpointEvent);

    let thread = vm.thread(breakpointEvent.thread);
    let frames = await thread.frames();
    console.log('thread', breakpointEvent.thread);
    console.log(frames.length);
    assert(frames.length === 1);
    frames = await thread.frames();
    assert(frames.length === 1);
    let frameCount = await thread.frameCount();
    assert(frameCount === 1);
    frameCount = await thread.frameCount();
    assert(frameCount === 1);

    console.log('---------------------');

    const frame = await thread.frame(0);
    const arr = await frame.visibleVariableByName('args');
    assert(arr);
    const v = await frame.getValue(arr);
    console.log(v);
    let arrObj = vm.objectMirror(v.value, v.tag);
    let length = await arrObj.getLength();
    assert(length === 0);

    const arrType = await arrObj.getType();
    arrObj = await arrType.newInstance(1);
    const strObj = await vm.createString('hello jdwp');
    await arrObj.setValue(0, strObj);
    length = await arrObj.getLength();
    assert(length === 1);
    const strV = await arrObj.getValue(0);
    assert.deepEqual(await strV.getValue(), 'hello jdwp');

    er = vm.eventRequestManager.createStepRequest(thread, -2, 1);
    er.suspendPolicy = 1;
    er.addCountFilter(1);
    await er.enable();

    const suspends = await thread.suspendCount();
    for (let i = 0; i < suspends; i++) {
      await thread.resume();
    }

    let stepEvent;
    do {
      const { events } = await awaitEvent(vm, 'event');
      for (const event of events) {
        if (event.eventKind === 'SINGLE_STEP') {
          stepEvent = event;
          break;
        }
      }
    } while (!stepEvent);

    thread = vm.thread(stepEvent.thread);
    frames = await thread.frames();
    console.log('thread', stepEvent.thread);
    console.log(frames.length);
    assert(frames.length === 2);
    frameCount = await thread.frameCount();
    assert(frameCount === 2);
    frameCount = await thread.frameCount();
    assert(frameCount === 2);
    console.log('---------------------');

    const threadGroup = await thread.getThreadGroup();
    const name = await threadGroup.getName();
    const parent = await threadGroup.getParent();
    assert(parent);
    console.log('threadGroup =>', name);

    await threadGroup.resume();
  });
});
