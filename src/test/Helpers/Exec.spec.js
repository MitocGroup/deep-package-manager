'use strict';

import chai from 'chai';
import {Exec} from '../../lib/Helpers/Exec';

suite('Helpers/Exec', () => {
  let cmd = 'test command';
  let args = 'arg1';
  let exec = new Exec(cmd, args);

  test('Class Exec exists in Helpers/Exec', () => {
    chai.expect(typeof Exec).to.equal('function');
  });

  test('Check constructor sets value for _cmd', () => {
    chai.expect(exec.cmd).to.equal(cmd);
  });

  test('Check constructor sets value for _args', () => {
    chai.expect(exec.args).to.eql([args]);
  });

  test('Check constructor sets value for _error=null', () => {
    chai.expect(exec._error).to.equal(null);
  });

  test('Check constructor sets value for _isExec=false', () => {
    chai.expect(exec._isExec).to.equal(false);
  });

  test('Check constructor sets value for _devNull=false', () => {
    chai.expect(exec._devNull).to.equal(false);
  });

  test('Check constructor sets value for _result=null', () => {
    chai.expect(exec._result).to.equal(null);
  });

  test('Check cwd getter', () => {
    chai.expect(exec.cwd).to.contains('deep-package-manager/src');
  });

  test('Check cwd setter', () => {
    let dirName = __dirname;
    let cwd = exec.cwd;

    exec.cwd = dirName;
    chai.expect(exec.cwd).to.equal(dirName);

    exec.cwd = cwd;
    chai.expect(exec.cwd).to.equal(cwd);
  });

  test('Check _assureCmdExecuted throws error', () => {
    let error = null;

    try {
      exec._assureCmdExecuted()
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceof(Error);
    chai.expect(error.message).to.contains(`Command '${exec._fullCmd}' is not yet executed`);
  });


  test('Check succeed getter returns true', () => {
    exec._isExec = true;

    chai.expect(exec.succeed).to.equal(true);
  });

  test('Check failed getter returns false', () => {
    exec._isExec = true;

    chai.expect(exec.failed).to.equal(false);
  });

  test('Check addArg() method', () => {
    let arg = 'arg2';

    let actualResult = exec.addArg(arg);

    chai.expect(actualResult).to.be.an.instanceof(Exec);
    chai.expect(exec.args).to.includes(arg);
  });
});
