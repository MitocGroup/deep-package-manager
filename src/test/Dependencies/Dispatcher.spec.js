'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Dispatcher} from '../../lib/Dependencies/Dispatcher';
import {DispatcherMock} from '../mock/Dependencies/DispatcherMock';

chai.use(sinonChai);

suite('Dependencies/Dispatcher', () => {
  let driver = 'driverTest';
  let dispatcher = new DispatcherMock(driver);

  test('Class Dispatcher exists in Dependencies/Dispatcher', () => {
    chai.expect(typeof Dispatcher).to.equal('function');
  });

  test('Check constructor sets valid value for _driver', () => {
    chai.expect(dispatcher.driver).to.be.equal(driver);
  });

  test('Check constructor sets valid value for _microservices=null', () => {
    chai.expect(dispatcher._microservices).to.be.equal(null);
  });

  test('Check microservices getter returns valid value', () => {
    //todo
    //chai.expect(dispatcher.microservices).to.be.eql([]);
  });

  test('Check dispatchBatch() method', () => {
    let spyCallback = sinon.spy();

    chai.expect(dispatcher.dispatch(spyCallback)).to.be.not.equal(null);
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