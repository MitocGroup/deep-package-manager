'use strict';

import chai from 'chai';
import {Manager} from '../../lib/Dependencies/Manager';
import {AbstractDriver} from '../../lib/Dependencies/Driver/AbstractDriver';

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

suite('Dependencies/Manager', () => {
  let dependencyDriver = new DependencyDriver();
  let manager = new Manager(dependencyDriver);
  //let dryRunInput = true;
  //let prefixInput = 'prefixTest';
  //let basePathInput = 'basePathTest';
  //let identifierInput = 'identifierTest';
  //let expectedResult = null;

  test('Class Manager exists in Dependencies/Manager', () => {
    chai.expect(Manager).to.be.an('function');
  });

  test('Check constructor sets valid value for _driver', () => {
    chai.expect(manager.driver).to.be.eql(dependencyDriver);
  });

  test('Check constructor throws exception for !(driver instanceof AbstractDriver)', () => {
    let error = null;
    try {
      new Manager();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.not.equal(null);
  });

  test('Check constructor sets valid value for _uploader', () => {
    //todo
    chai.expect(manager.uploader).to.be.not.equal(null);
  });

  test('Check constructor sets valid value for _resolver', () => {
    //todo
    chai.expect(manager.resolver).to.be.not.equal(null);
  });

  test('Check pushBatch() method return valid value', () => {
    //todo
    //chai.expect(manager.pushBatch(['test'])).to.be.not.equal(null);
  });
});
