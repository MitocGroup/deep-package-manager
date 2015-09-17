'use strict';

import chai from 'chai';
import {WaitFor} from '../../lib.compiled/Helpers/WaitFor';
import {InvalidArgumentException} from '../../lib.compiled/Exception/InvalidArgumentException';


suite('Helpers/WaitFor', function() {
  let waitFor = new WaitFor();
  let waitForChild = new WaitFor();
  let actualResult = null;
  let error = null;
  let index = null;

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
    chai.expect(error.message).to.be.an.equal(`Invalid argument ${index} of type number provided (meant existing index).`);
  });

  test('Check child() method returns child object by index', function() {
    index = 1;
    error = null;
    try {
      actualResult = waitFor.child(index);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.equal(null);
    //chai.expect(actualResult).to.be.eql(waitForChild);
  });
});