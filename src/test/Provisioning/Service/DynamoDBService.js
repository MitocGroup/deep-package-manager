'use strict';

import chai from 'chai';
import {DynamoDBService} from '../../../lib.compiled/Provisioning/Service/DynamoDBService';
import Core from '@mitocgroup/deep-core';

suite('Provisioning/Service/DynamoDBService', function() {
  let dynamoDBService = new DynamoDBService();

  test('Class DynamoDBService exists in Provisioning/Service/DynamoDBService', function() {
    chai.expect(typeof DynamoDBService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(dynamoDBService._readyTeardown).to.be.equal(false);
    chai.expect(dynamoDBService._ready).to.be.equal(false);
  });

  test('Check name() method returns \'dynamodb\'', function() {
    chai.expect(dynamoDBService.name()).to.be.equal('dynamodb');
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(DynamoDBService.AVAILABLE_REGIONS.length).to.be.equal(1);
    chai.expect(DynamoDBService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ANY);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
    chai.expect(dynamoDBService._readyTeardown).to.be.equal(false);
    let actualResult = dynamoDBService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    dynamoDBService._ready = false;
    let actualResult = dynamoDBService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});