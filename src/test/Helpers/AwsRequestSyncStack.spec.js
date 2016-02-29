'use strict';

import chai from 'chai';
import {AwsRequestSyncStack} from '../../lib/Helpers/AwsRequestSyncStack';

suite('Helpers/AwsRequestSyncStack', () => {
  let awsRequestSyncStack = new AwsRequestSyncStack();

  test('Class AwsRequestSyncStack exists in Helpers/AwsRequestSyncStack', () => {
    chai.expect(AwsRequestSyncStack).to.be.an('function');
  });

  test('Check constructor sets valid values', () => {
    chai.expect(awsRequestSyncStack._stack).to.be.eql([]);
    chai.expect(awsRequestSyncStack.count).to.be.equal(0);
    chai.expect(awsRequestSyncStack._levels).to.be.eql([]);
    chai.expect(awsRequestSyncStack.completed).to.be.equal(0);
  });

  test('Check addLevel()', () => {
    chai.expect(awsRequestSyncStack.levelsDepth).to.be.equal(0);

    let actualResult = awsRequestSyncStack.addLevel();
    chai.expect(actualResult).to.be.an.instanceof(AwsRequestSyncStack);
    chai.expect(awsRequestSyncStack.levelsDepth).to.be.equal(1);

    actualResult = awsRequestSyncStack.addLevel();
    chai.expect(actualResult).to.be.an.instanceof(AwsRequestSyncStack);
    chai.expect(awsRequestSyncStack.levelsDepth).to.be.equal(2);
  });

  test('Check level() for level 1 with levelsDepth=2 and strict mode', () => {
    let error = null;
    let actualResult = null;
    let expectedResult = {
      _completed: 0,
      _joinTimeout: 0,
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

  test('Check level() throws exception when levelsDepth < level in strict mode', () => {
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

  test('Check level() for levelsDepth < level in !strict mode', () => {
    let awsRequestSyncStackNegative = new AwsRequestSyncStack();
    let expectedResult = {
      _completed: 0,
      _joinTimeout: 0,
      _levels: [],
      _stack: [],
    };

    let actualResult = awsRequestSyncStackNegative.level(1, false);

    chai.expect(actualResult).to.be.eql(expectedResult);
  });

  test('Check wrapRequest() static method', () => {
    let error = null;
    let actualResult = null;
    let response = {response: 'Body'};
    let request = {
      method: 'GET',
      send: () => {
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
