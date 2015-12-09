'use strict';

import chai from 'chai';
import {AbstractDriver} from '../../../lib/Dependencies/Driver/AbstractDriver';
import {Exception} from '../../../lib/Dependencies/Exception/Exception';
import OS from 'os';
import Path from 'path';
import {Hash} from '../../../lib/Helpers/Hash';

/**
 * Dependency driver implements abstract methods from AbstractDriver
 */
class DependencyDriver extends AbstractDriver{
  constructor() {
    super();
  }

  pull() {
    return this;
  }

  push() {
    return this;
  }
}

suite('Dependencies/Driver/AbstractDriver', function() {
  let dependencyDriver = new DependencyDriver();
  let dryRunInput = true;
  let prefixInput = 'prefixTest';
  let basePathInput = 'basePathTest';
  let identifierInput = 'identifierTest';
  let expectedResult = null;

  test('Class AbstractDriver exists in Dependencies/Driver/AbstractDriver', function() {
    chai.expect(typeof AbstractDriver).to.equal('function');
  });

  test('Check constructor sets valid value for _dryRun=false', function() {
    chai.expect(dependencyDriver.dryRun).to.be.equal(false);
  });

  test('Check constructor sets valid value for _prefix=\'\'', function() {
    chai.expect(dependencyDriver.prefix).to.be.equal('');
  });

  test('Check constructor sets valid value for _basePath', function() {
    chai.expect(dependencyDriver.basePath).to.be.equal(process.cwd());
  });

  test('Check dryRun getter/setter gets/sets valid value', function() {
    dependencyDriver.dryRun = dryRunInput;
    chai.expect(dependencyDriver.dryRun).to.be.equal(dryRunInput);
  });

  test('Check prefix getter/setter gets/sets valid value', function() {
    dependencyDriver.prefix = prefixInput;
    chai.expect(dependencyDriver.prefix).to.be.equal(prefixInput);
  });

  test('Check basePath getter/setter gets/sets valid value', function() {
    dependencyDriver.basePath = basePathInput;
    chai.expect(dependencyDriver.basePath).to.be.equal(basePathInput);
    dependencyDriver.basePath = process.cwd();
  });

  test('Check getTmpDir static getter returns \'.tar.gz\'', function() {
    chai.expect(AbstractDriver.ARCHIVE_EXTENSION).to.be.equal('.tar.gz');
  });

  test('Check getTmpDir static method returns valid value', function() {
    let time = (new Date()).getTime().toString();
    time = time.substring(0, (time.length - 3));
    expectedResult = Path.join(OS.tmpdir(), Hash.md5(identifierInput) + '-' + time);
    chai.expect(AbstractDriver.getTmpDir(identifierInput)).to.be.contains(expectedResult);
  });

  //todo
  test('Check errorCallback(descriptor) throws Exception', function() {
    let error = null;
    try {
      AbstractDriver.errorCallback('descriptor');
    } catch (e) {
      error = e;
      chai.expect(error).to.be.an.instanceOf(Exception);
      chai.expect(error.message).to.be.an.equal(`Error while ${descriptor}: ${error}`);
    }
  });
});