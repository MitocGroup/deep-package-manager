'use strict';

import chai from 'chai';
import {Dispatcher} from '../../lib.compiled/Dependencies/Dispatcher';

/**
 * Dependency dispatcher implements abstract method from Dispatcher
 */
class DependencyDispatcher extends Dispatcher {
  constructor(driver) {
    super(driver);
  }

  dispatch() {
    return this;
  }
}

suite('Dependencies/Dispatcher', function() {
  let driver = 'driverTest';
  let dispatcher = new DependencyDispatcher(driver);
  let callbackFunction = function() {
    return 'callbackValue';
  };

  test('Class Dispatcher exists in Dependencies/Dispatcher', function() {
    chai.expect(typeof Dispatcher).to.equal('function');
  });

  test('Check constructor sets valid value for _driver', function() {
    chai.expect(dispatcher.driver).to.be.equal(driver);
  });

  test('Check constructor sets valid value for _microservices=null', function() {
    chai.expect(dispatcher._microservices).to.be.equal(null);
  });

  test('Check microservices getter returns valid value', function() {
    //todo
    //chai.expect(dispatcher.microservices).to.be.eql([]);
  });

  test('Check dispatchBatch() method', function() {
    //todo
    chai.expect(dispatcher.dispatch(callbackFunction)).to.be.not.equal(null);
    //error = null;
    //try {
    //  waitFor.ready(callbackFunction);
    //} catch (e) {
    //  error = e;
    //}
    //
    //chai.expect(error).to.be.equal(null);
    //chai.expect(waitFor.remaining).to.be.eql(0);
  });
});