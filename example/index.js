'use strict';

const fs = require('fs');
const path = require('path');
const { launch } = require('../lib/launcher');

async function main() {
  console.log('Begin debug Test.java');
  console.log('-----------------------');
  const content = fs.readFileSync(path.join(__dirname, 'Test.java'), 'utf8');
  console.log(content.split('\n').map((line, i) => {
    return (i + 1) + '  ' + line;
  }).join('\r\n'));
  console.log('-----------------------');
  console.log();

  const vm = await launch({
    mainClass: 'Test',
    vmArgs: [ '-Dfile.encoding=UTF-8', '-Xdebug', '-Xnoagent', '-Djava.compiler=NONE' ],
    classPaths: [ __dirname ],
  });
  vm.on('event', async ({ events }) => {
    for (const event of events) {
      if (event.eventKind === 'BREAKPOINT') {
        const thread = vm.thread(event.thread);

        const frames = await thread.frames();
        const frame = frames[0];
        const m = await frame.location.getMethod();
        const { lineLocations } = await m.getBaseLocations();
        let line;
        for (const location of lineLocations) {
          if (location.codeIndex <= event.location.index) {
            line = location.baseLineInfo;
          }
        }
        console.log('suspend at breakpoint line:' + line.lineNumber);

        const v = await frame.visibleVariableByName('c');
        const value = await frame.getValue(v);
        console.log('get local variable c =', value.value);

        await frame.setValue(v, {
          tag: value.tag,
          value: 4,
        });
        console.log('set local variable c = 4');

        const er = vm.eventRequestManager.createStepRequest(thread, -2, 2);
        er.suspendPolicy = 1;
        er.addCountFilter(1);
        await er.enable();

        const suspends = await thread.suspendCount();
        for (let i = 0; i < suspends; i++) {
          await thread.resume();
        }

      } else if (event.eventKind === 'SINGLE_STEP') {
        const thread = vm.thread(event.thread);
        const er = vm.eventRequestManager.createStepRequest(thread, -2, 2);
        er.suspendPolicy = 1;
        er.addCountFilter(1);
        await er.enable();

        const clazz = vm.classType(event.location.classID);
        const className = await clazz.getName();
        const m = await clazz.getMethod(event.location.methodID);
        const { lineLocations } = await m.getBaseLocations();
        let line;
        for (const location of lineLocations) {
          if (location.codeIndex <= event.location.index) {
            line = location.baseLineInfo;
          }
        }
        console.log('step =>', className, m.name + '()', 'line:' + line.lineNumber, await line.getLiSourcePath());

        const suspends = await thread.suspendCount();
        for (let i = 0; i < suspends; i++) {
          await thread.resume();
        }
      } else if (event.eventKind !== 'METHOD_ENTRY') {
        // const thread = vm.thread(event.thread);
        // const frames = await thread.frames();
        // const variables = await frames[0].visibleVariables();
        // console.log(variables);
        // const value = await frames[0].getValue(variableC);
        // console.log(value);
      } else if (event.eventKind !== 'CLASS_PREPARE') {
        console.log(event);
      }
    }
  });
  await vm.ready();

  const er = vm.eventRequestManager.createClassPrepareRequest();
  // er.suspendPolicy = 2;
  er.addClassFilter('Test');

  er.on('event', async () => {
    const clazzes = await vm.retrieveClassesBySignature('LTest;');
    for (const clazz of clazzes) {
      const locations = await clazz.locationsOfLine(10);
      if (locations.length) {
        const er = vm.eventRequestManager.createBreakpointRequest(locations[0]);
        er.suspendPolicy = 1;
        await er.enable();
      }
    }

    await vm.resume();
  });

  await er.enable();

  // er = vm.eventRequestManager.createMethodEntryRequest();
  // er.suspendPolicy = 1;
  // er.addClassFilter('test');
  // await er.enable();

  await vm.resume();
}

main().catch(err => {
  console.log(err);
});
