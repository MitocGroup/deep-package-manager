'use strict';

import chai from 'chai';
import {Exec} from '../../lib/Helpers/Exec';

suite('Helpers/Exec', function() {
  let cmd = 'test command';
  let args = 'arg1';
  let exec = new Exec(cmd, args);

  test('Class Exec exists in Helpers/Exec', function() {
    chai.expect(typeof Exec).to.equal('function');
  });

  test('Check constructor sets value for _cmd', function() {
    chai.expect(exec.cmd).to.equal(cmd);
  });

  test('Check constructor sets value for _args', function() {
    chai.expect(exec.args).to.eql([args]);
  });

  test('Check constructor sets value for _error=null', function() {
    chai.expect(exec._error).to.equal(null);
  });

  test('Check constructor sets value for _isExec=false', function() {
    chai.expect(exec._isExec).to.equal(false);
  });

  test('Check constructor sets value for _devNull=false', function() {
    chai.expect(exec._devNull).to.equal(false);
  });

  test('Check constructor sets value for _result=null', function() {
    chai.expect(exec._result).to.equal(null);
  });

  test('Check cwd getter', function() {
    chai.expect(exec.cwd).to.contains('deep-package-manager/src');
  });

  test('Check cwd setter', function() {
    let dirName = __dirname;
    let cwd = exec.cwd;

    exec.cwd = dirName;
    chai.expect(exec.cwd).to.equal(dirName);

    exec.cwd = cwd;
    chai.expect(exec.cwd).to.equal(cwd);
  });

  test('Check _assureCmdExecuted throws error', function() {
    let error = null;

    try {
      exec._assureCmdExecuted()
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceof(Error);
    chai.expect(error.message).to.contains(`Command '${exec._fullCmd}' is not yet executed`);
  });


  test('Check succeed getter returns true', function() {
    exec._isExec = true;

    chai.expect(exec.succeed).to.equal(true);
  });

  test('Check failed getter returns false', function() {
    exec._isExec = true;

    chai.expect(exec.failed).to.equal(false);
  });

  test('Check addArg() method', function() {
    let arg = 'arg2';

    let actualResult = exec.addArg(arg);

    chai.expect(actualResult).to.be.an.instanceof(Exec);
    chai.expect(exec.args).to.includes(arg);
  });
});
