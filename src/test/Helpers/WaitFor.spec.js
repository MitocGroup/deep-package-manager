'use strict';

import chai from 'chai';
import {WaitFor} from '../../lib/Helpers/WaitFor';
import {InvalidArgumentException} from '../../lib/Exception/InvalidArgumentException';

suite('Helpers/WaitFor', function() {
  let waitFor = new WaitFor();
  let waitForChild = new WaitFor();
  let actualResult = null;
  let error = null;
  let index = null;
  let stackItem = function() {
    return 'stackValue';
  };

  let callbackFunction = function() {
    return 'callbackValue';
  };

  test('Class WaitFor exists in Helpers/WaitFor', function() {
    chai.expect(typeof WaitFor).to.equal('function');
  });

  test('Check constructor sets valid default value for _children', function() {
    chai.expect(waitFor.children).to.be.eql([]);
  });

  test('Check childrenCount() method return 0', function() {
    chai.expect(waitFor.childrenCount).to.be.equal(0);
  });

  test('Check addChild() method throws MethodsNotImplementedException exception', function() {
    try {
      waitFor.addChild({});
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);
  });

  test('Check addChild() method adds child', function() {
    actualResult = waitFor.addChild(waitForChild);
    chai.expect(waitFor.childrenCount).to.be.equal(1);
    chai.expect(actualResult.children[0]).to.be.eql(waitForChild);
  });

  test('Check TICK_TTL getter returns more than 0', function() {
    chai.expect(WaitFor.TICK_TTL).to.be.above(0);
  });

  test('Check child() method throws InvalidArgumentException exception when required index doesn\'t exist', function() {
    index = 2;
    error = null;
    try {
      actualResult = waitFor.child(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);

    //chai.expect(error.message).to.be.equal(`Invalid argument ${index} of type number provided (meant existing index).`);
  });

  test('Check child() method returns child object by index', function() {
    index = 0;
    error = null;
    try {
      actualResult = waitFor.child(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.equal(null);
    chai.expect(actualResult).to.be.eql(waitForChild);
  });

  test('Check push() method adds object _stack array', function() {
    error = null;
    try {
      actualResult = waitFor.push(stackItem);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.equal(null);
    chai.expect(actualResult._stack[0]).to.be.eql(stackItem);
  });

  test('Check push() method throws InvalidArgumentException exception when the added item is not Function', function() {
    error = null;
    try {
      actualResult = waitFor.push(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);

    //chai.expect(error.message).to.be.an.equal(`Invalid argument ${index} of type number provided (meant Function).`);
  });

  test('Check count getter returns valid value', function() {
    chai.expect(waitFor.count).to.be.above(0);
  });

  test('Check remaining getter returns valid value', function() {
    chai.expect(waitFor.remaining).to.be.above(0);
  });

  test('Check ready() method throws InvalidArgumentException exception when the callback is not Function', function() {
    error = null;
    try {
      actualResult = waitFor.ready(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);

    //chai.expect(error.message).to.be.an.equal(`Invalid argument ${index} of type number provided (meant Function).`);
  });

  test('Check push() method adds object _stack array', function() {
    error = null;
    try {
      waitFor.ready(callbackFunction);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.equal(null);
    chai.expect(waitFor.remaining).to.be.eql(0);
  });
});
