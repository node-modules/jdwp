# jdwp
Java Debug Wire Protocol

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/jdwp.svg?style=flat-square
[npm-url]: https://npmjs.org/package/jdwp
[travis-image]: https://img.shields.io/travis/node-modules/jdwp.svg?style=flat-square
[travis-url]: https://travis-ci.org/node-modules/jdwp
[codecov-image]: https://codecov.io/gh/node-modules/jdwp/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/jdwp
[david-image]: https://img.shields.io/david/node-modules/jdwp.svg?style=flat-square
[david-url]: https://david-dm.org/node-modules/jdwp
[snyk-image]: https://snyk.io/test/npm/jdwp/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/jdwp
[download-image]: https://img.shields.io/npm/dm/jdwp.svg?style=flat-square
[download-url]: https://npmjs.org/package/jdwp


## Install

```bash
$ npm i jdwp --save
```

## Usage

launch the java project and connect to jvm

```js
const { launcher } = require('jdwp')

const vm = await launcher.launch({
  mainClass: 'Test',
  vmArgs: [ '-Dfile.encoding=UTF-8', '-Xdebug', '-Xnoagent', '-Djava.compiler=NONE' ],
  classPaths: [ __dirname ],
});
vm.on('event', async ({ events }) => {
  console.log(events);
});
await vm.ready();
await vm.resume();
```

run the [example](./example/index.js) demo

```bash
$ node example/index.js

Begin debug Test.java
-----------------------
1  public class Test {
2      public int plus(int a, int b) {
3      	int c = a + b;
4      	return c;
5      }
6
7      public static void main(String[] args) {
8      	Test test = new Test();
9      	int c = test.plus(1, 2);
10      	System.out.println(c);
11          System.out.println("Hello world");
12      }
13  }
14
-----------------------

suspend at breakpoint line:10
get local variable c = 3
set local variable c = 4
4
step => Test main() line:11 Test/Test.java
Hello world
step => Test main() line:12 Test/Test.java
step => java.lang.Thread exit() line:757 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:758 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:759 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:762 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:764 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:765 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:766 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:767 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:768 java/lang/Thread/Thread.java
step => java.lang.Thread exit() line:769 java/lang/Thread/Thread.java
```

## Protocol

https://docs.oracle.com/javase/7/docs/platform/jpda/jdwp/jdwp-protocol.html

- VirtualMachine Command Set (1)
  - [x] Version (1)
  - [x] ClassesBySignature (2)
  - [x] AllClasses (3)
  - [x] AllThreads (4)
  - [x] TopLevelThreadGroups (5)
  - [x] Dispose (6)
  - [x] IDSizes (7)
  - [x] Suspend (8)
  - [x] Resume (9)
  - [x] Exit (10)
  - [x] CreateString (11)
  - [x] Capabilities (12)
  - [x] ClassPaths (13)
  - [ ] DisposeObjects (14)
  - [x] HoldEvents (15)
  - [x] ReleaseEvents (16)
  - [x] CapabilitiesNew (17)
  - [x] RedefineClasses (18)
  - [x] SetDefaultStratum (19)
  - [x] AllClassesWithGeneric (20)
  - [x] InstanceCounts (21)
- ReferenceType Command Set (2)
  - [x] Signature (1)
  - [x] ClassLoader (2)
  - [x] Modifiers (3)
  - [x] Fields (4)
  - [x] Methods (5)
  - [x] GetValues (6)
  - [x] SourceFile (7)
  - [x] NestedTypes (8)
  - [x] Status (9)
  - [x] Interfaces (10)
  - [x] ClassObject (11)
  - [x] SourceDebugExtension (12)
  - [x] SignatureWithGeneric (13)
  - [x] FieldsWithGeneric (14)
  - [x] MethodsWithGeneric (15)
  - [x] Instances (16)
  - [x] ClassFileVersion (17)
  - [x] ConstantPool (18)
- ClassType Command Set (3)
  - [x] Superclass (1)
  - [x] SetValues (2)
  - [x] InvokeMethod (3)
  - [x] NewInstance (4)
- ArrayType Command Set (4)
  - [x] NewInstance (1)
- InterfaceType Command Set (5)
- Method Command Set (6)
  - [x] LineTable (1)
  - [x] VariableTable (2)
  - [x] Bytecodes (3)
  - [x] IsObsolete (4)
  - [x] VariableTableWithGeneric (5)
- Field Command Set (8)
- ObjectReference Command Set (9)
  - [x] ReferenceType (1)
  - [x] GetValues (2)
  - [x] SetValues (3)
  - [x] MonitorInfo (5)
  - [x] InvokeMethod (6)
  - [x] DisableCollection (7)
  - [x] EnableCollection (8)
  - [x] IsCollected (9)
  - [x] ReferringObjects (10)
- StringReference Command Set (10)
  - [x] Value (1)
- ThreadReference Command Set (11)
  - [x] Name (1)
  - [x] Suspend (2)
  - [x] Resume (3)
  - [x] Status (4)
  - [x] ThreadGroup (5)
  - [x] Frames (6)
  - [x] FrameCount (7)
  - [ ] OwnedMonitors (8)
  - [ ] CurrentContendedMonitor (9)
  - [x] Stop (10)
  - [x] Interrupt (11)
  - [x] SuspendCount (12)
  - [ ] OwnedMonitorsStackDepthInfo (13)
  - [x] ForceEarlyReturn (14)
- ThreadGroupReference Command Set (12)
  - [x] Name (1)
  - [x] Parent (2)
  - [x] Children (3)
- ArrayReference Command Set (13)
  - [x] Length (1)
  - [x] GetValues (2)
  - [x] SetValues (3)
- ClassLoaderReference Command Set (14)
  - [x] VisibleClasses (1)
- EventRequest Command Set (15)
  - [x] Set (1)
  - [x] Clear (2)
  - [x] ClearAllBreakpoints (3)
- StackFrame Command Set (16)
  - [x] GetValues (1)
  - [x] SetValues (2)
  - [x] ThisObject (3)
  - [x] PopFrames (4)
- ClassObjectReference Command Set (17)
  - [x] ReflectedType (1)
- Event Command Set (64)
  - [x] Composite (100)
