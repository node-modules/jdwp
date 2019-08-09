'use strict';

const net = require('net');
const path = require('path');
const cp = require('child_process');
const JDWPConnection = require('./connection');
const VirtualMachine = require('./virtual_machine');

exports.launch = async ({ mainClass, modulePaths, classPaths, vmArgs, home, exe = 'java' }) => {
  return new Promise((resolve, reject) => {
    let proc;
    const server = net.createServer({
      pauseOnConnect: true,
    }, socket => {
      const vm = new VirtualMachine(new JDWPConnection({ socket }));
      server.close();
      resolve(vm);
      if (proc) {
        proc.removeListener('error', reject);
      }
    });
    server.listen(0, () => {
      const { port } = server.address();
      const command = home ? path.join(home, 'bin', exe) : exe;
      const args = [
        `-Xrunjdwp:transport=dt_socket,address=127.0.0.1:${port},suspend=y,server=n`,
      ];
      if (vmArgs) {
        args.push.apply(args, vmArgs);
      }
      if (modulePaths) {
        args.push(
          '--module-path',
          modulePaths.join(':')
        );
      }
      if (classPaths) {
        args.push(
          '-cp',
          classPaths.join(':')
        );
      }
      args.push(mainClass);
      proc = cp.spawn(command, args, { stdio: 'inherit' });
      proc.once('error', reject);
    });
  });
};
