'use strict';

import chai from 'chai';
import {Resolver} from '../../lib/Dependencies/Resolver';

/**
 * Dependency dispatcher implements abstract method from Dispatcher
 */
class DependencyResolver extends Resolver {
  constructor(driver) {
    super(driver);
  }

  dispatch() {
    return this;
  }
}

suite('Dependencies/Resolver', function() {
  let driver = 'driverTest';
  let resolver = new DependencyResolver(driver);

  test('Class Resolver exists in Dependencies/Resolver', function() {
    chai.expect(typeof Resolver).to.equal('function');
  });

  test('Check constructor sets valid value for _resolveStack=[]', function() {
    chai.expect(resolver._resolveStack).to.be.eql([]);
  });
});