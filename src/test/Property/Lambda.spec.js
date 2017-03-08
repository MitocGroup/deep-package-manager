'use strict';

import chai from 'chai';
import {Lambda} from '../../lib/Property/Lambda';

suite('Property/Lambda', () => {

  let propertyInstance = {
    path: 'propertyPath',
    identifier: 'appIdentifier',
    config: {
      awsAccountId: 123456789012,
    },
    provisioning: {
      lambda: {
        config: {
          region: 'us-west-2',
        },
      },
    },
  };
  let microserviceIdentifier = 'microserviceIdentifierTest';
  let identifier = 'lambdaIdentifierTest';
  let name = 'lambdaNameTest';
  let execRole = { Arn: 'executeRoleArn' };
  let path = 'Property';
  //let lambda = new Lambda(propertyInstance, microserviceIdentifier, identifier, name, execRole, path);
  let positiveError = {
    code: 'ResourceConflictException',
    statusCode: 409,
  };
  let negativeError = {
    code: 'ResourceNotFound',
    statusCode: 404,
  };
  let expectedResult = null;
  let timeoutInput = 128;

  test('Class Lambda exists in Property/Lambda', () => {
    chai.expect(Lambda).to.be.an('function');
  });

  test('Check isErrorFalsePositive static method returns true', () => {
    chai.expect(Lambda.isErrorFalsePositive(positiveError)).to.be.equal(true);
  });

  test('Check isErrorFalsePositive static method returns false', () => {
    chai.expect(Lambda.isErrorFalsePositive(negativeError)).to.be.equal(false);
  });

  test('Check DEFAULT_TIMEOUT static getter returns value above 0', () => {
    chai.expect(Lambda.DEFAULT_TIMEOUT).to.be.above(0);
  });

  test('Check DEFAULT_MEMORY_LIMIT static getter returns value above 0', () => {
    chai.expect(Lambda.DEFAULT_MEMORY_LIMIT).to.be.above(0);
  });

  test('Check CONFIG_FILE static getter returns \'_config.json\'', () => {
    chai.expect(Lambda.CONFIG_FILE).to.be.equal('_config.json');
  });
});
