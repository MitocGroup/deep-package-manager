'use strict';

import chai from 'chai';
import {WaitFor} from '../../lib/Helpers/WaitFor';
import {InvalidArgumentException} from '../../lib/Exception/InvalidArgumentException';

suite('Helpers/WaitFor', () => {
  let waitFor = new WaitFor();
  let waitForChild = new WaitFor();
  let actualResult = null;
  let error = null;
  let index = null;
  let stackItem = () => {
    return 'stackValue';
  };

  let callbackFunction = () => {
    return 'callbackValue';
  };

  test('Class WaitFor exists in Helpers/WaitFor', () => {
    chai.expect(WaitFor).to.be.an('function');
  });

  test('Check TICK_TTL getter returns more than 0', () => {
    chai.expect(WaitFor.TICK_TTL).to.be.above(0);
  });

  test('Check push() method adds object _stack array', () => {
    actualResult = waitFor.push(stackItem);

    chai.expect(actualResult._stack[0]).to.be.eql(stackItem);
  });

  test('Check push() method throws InvalidArgumentException exception when the added item is not Function', () => {
    error = null;

    try {
      waitFor.push(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);
  });

  test('Check count getter returns valid value', () => {
    chai.expect(waitFor.count).to.be.above(0);
  });

  test('Check remaining getter returns valid value', () => {
    chai.expect(waitFor.remaining).to.be.above(0);
  });

  test('Check ready() method throws InvalidArgumentException exception when the callback is not Function', () => {
    error = null;

    try {
      actualResult = waitFor.ready(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);
  });

  test('Check push() method adds object _stack array', () => {
    waitFor.ready(callbackFunction);

    chai.expect(waitFor.remaining).to.be.eql(0);
  });
});
