'use strict';

import chai from 'chai';
import {AwsRequestSyncStack} from '../../lib/Helpers/AwsRequestSyncStack';

suite('Helpers/AwsRequestSyncStack', function () {
  let awsRequestSyncStack = new AwsRequestSyncStack();

  test('Class AwsRequestSyncStack exists in Helpers/AwsRequestSyncStack', function () {
    chai.expect(typeof AwsRequestSyncStack).to.equal('function');
  });

  test('Check constructor sets valid values', function () {
    chai.expect(awsRequestSyncStack._stack).to.be.eql([]);
    chai.expect(awsRequestSyncStack.count).to.be.equal(0);
    chai.expect(awsRequestSyncStack._levels).to.be.eql([]);
    chai.expect(awsRequestSyncStack.completed).to.be.equal(0);
  });

  test('Check addLevel()', function () {
    chai.expect(awsRequestSyncStack.levelsDepth).to.be.equal(0);

    let actualResult = awsRequestSyncStack.addLevel();
    chai.expect(actualResult).to.be.an.instanceof(AwsRequestSyncStack);
    chai.expect(awsRequestSyncStack.levelsDepth).to.be.equal(1);

    actualResult = awsRequestSyncStack.addLevel();
    chai.expect(actualResult).to.be.an.instanceof(AwsRequestSyncStack);
    chai.expect(awsRequestSyncStack.levelsDepth).to.be.equal(2);
  });

  test('Check level() throws exception when level > 1', function () {
    let error = null;

    try {
      awsRequestSyncStack.level(2, true);
    } catch (e) {
      error = e;
    }

    chai.assert.instanceOf(error, Error, 'e is an instance of Exception');
    chai.expect(error.message).to.be.contains('Avoid using level > 1 until late call is implemented!');
  });

  test('Check level() for level 1 with levelsDepth=2 and strict mode', function () {
    let error = null;
    let actualResult = null;
    let expectedResult = {
      _completed: 0,
      _levels: [],
      _stack: [],
    };
    try {
      actualResult = awsRequestSyncStack.level(1, true);
    } catch (e) {
      error = e;
    }

    chai.expect(actualResult).to.be.an.instanceof(AwsRequestSyncStack);
    chai.expect(actualResult).to.be.eql(expectedResult);
  });

  test('Check level() throws exception when levelsDepth < level in strict mode', function () {
    let awsRequestSyncStackNegative = new AwsRequestSyncStack();
    let error = null;

    try {
      awsRequestSyncStackNegative.level(1, true);
    } catch (e) {
      error = e;
    }

    chai.assert.instanceOf(error, Error, 'e is an instance of Exception');
    chai.expect(error.message).to.be.contains(`Current levels depth is ${awsRequestSyncStackNegative.levelsDepth}`);
  });

  test('Check level() for levelsDepth < level in !strict mode', function () {
    let awsRequestSyncStackNegative = new AwsRequestSyncStack();
    let expectedResult = {
      _completed: 0,
      _levels: [],
      _stack: [],
    };

    let actualResult = awsRequestSyncStackNegative.level(1, false);

    chai.expect(actualResult).to.be.eql(expectedResult);
  });

  test('Check wrapRequest() static method', function () {
    let error = null;
    let actualResult = null;
    let response = {response: 'Body'};
    let request = {
      method: 'GET',
      send: function() {
        return response;
      },
    };
    try {
      actualResult = AwsRequestSyncStack.wrapRequest(request);
    } catch (e) {
      error = e;
    }

    chai.expect(actualResult.native()).to.be.eql(request);
    chai.expect(actualResult.response()).to.be.equal(null);
    chai.expect(actualResult.sent()).to.be.equal(false);
    chai.expect(actualResult.send()).to.be.equal(response);
  });
});
