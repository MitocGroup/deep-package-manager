'use strict';

import chai from 'chai';
import {Manager} from '../../lib.compiled/Dependencies/Manager';
import {AbstractDriver} from '../../lib.compiled/Dependencies/Driver/AbstractDriver';

/**
 * Dependency driver implements abstract methods from AbstractDriver
 */
class DependencyDriver extends  AbstractDriver{
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

suite('Dependencies/Manager', function() {
  let dependencyDriver = new DependencyDriver();
  let manager = new Manager(dependencyDriver);
  //let dryRunInput = true;
  //let prefixInput = 'prefixTest';
  //let basePathInput = 'basePathTest';
  //let identifierInput = 'identifierTest';
  //let expectedResult = null;

  test('Class Manager exists in Dependencies/Manager', function() {
    chai.expect(typeof Manager).to.equal('function');
  });

  test('Check constructor sets valid value for _driver', function() {
    chai.expect(manager.driver).to.be.eql(dependencyDriver);
  });

  test('Check constructor throws exception for !(driver instanceof AbstractDriver)', function() {
    let error = null;
    try {
      let invalidManager = new Manager();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.not.equal(null);
  });

  test('Check constructor sets valid value for _uploader', function() {
    //todo
    chai.expect(manager.uploader).to.be.not.equal(null);
  });

  test('Check constructor sets valid value for _resolver', function() {
    //todo
    chai.expect(manager.resolver).to.be.not.equal(null);
  });

  test('Check pushBatch() method return valid value', function() {
    //todo
    //chai.expect(manager.pushBatch(['test'])).to.be.not.equal(null);
  });
});
