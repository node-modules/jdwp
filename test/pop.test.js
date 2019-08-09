'use strict';

const mm = require('mm');
const path = require('path');
const assert = require('assert');
const sleep = require('mz-modules/sleep');
const awaitEvent = require('await-event');
const { launcher } = require('../');

describe('test/pop.test.js', () => {
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
    const locations = await clazz.locationsOfLine(7);
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

    const thread = vm.thread(breakpointEvent.thread);
    const frame = await thread.frame(0);

    const c = await frame.visibleVariableByName('c');
    assert(c);
    const v = await frame.getValue(c);
    console.log(v);
    assert.deepEqual(v, { tag: 73, value: 3 });

    const method = await frame.currentMethod();
    assert(method);
    const buf = await method.bytecodes();
    assert(Buffer.isBuffer(buf));
    console.log(buf);
    const isObsolete = await method.isObsolete();
    assert(!isObsolete);

    await vm.eventRequestManager.deleteAllBreakpoints();
    await frame.pop();

    console.log(await thread.getStatus());

    await vm.resume();
  });
});
