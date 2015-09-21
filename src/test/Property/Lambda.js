'use strict';

import chai from 'chai';
import {Lambda} from '../../lib.compiled/Property/Lambda';

suite('Property/Lambda', function() {

  let propertyInstance = {
    path: 'propertyPath',
    identifier: 'propertyIdentifier',
  };
  let microserviceIdentifier = 'microserviceIdentifierTest';
  let identifier = 'lambdaIdentifierTest';
  let name = 'lambdaNameTest';
  let execRole = 'executeRole';
  let path = 'Property';
  let lambda = new Lambda(propertyInstance, microserviceIdentifier, identifier, name, execRole, path);
  let positiveError = {
    code: 'ResourceConflictException',
    statusCode: 409,
  };
  let negativeError = {
    code: 'ResourceNotFound',
    statusCode: 404,
  };
  let expectedResult = null;

  test('Class Lambda exists in Property/Lambda', function() {
    chai.expect(typeof Lambda).to.equal('function');
  });

  test('Check constructor set valid default value for _uploadedLambda', function() {
    chai.expect(lambda.uploadedLambda).to.be.an.equal(null);
  });

  test('Check zipPath getter returns valid value', function() {
    expectedResult = `${propertyInstance.path}/${microserviceIdentifier}_lambda_${identifier}.zip`;
    chai.expect(lambda.zipPath).to.be.equal(expectedResult);
  });

  test('Check outputPath getter returns valid value', function() {
    chai.expect(lambda.outputPath).to.be.equal(propertyInstance.path);
  });

  test('Check propertyIdentifier getter returns valid value', function() {
    chai.expect(lambda.propertyIdentifier).to.be.equal(propertyInstance.identifier);
  });

  test('Check isErrorFalsePositive static method returns true', function() {
    chai.expect(Lambda.isErrorFalsePositive(positiveError)).to.be.equal(true);
  });

  test('Check isErrorFalsePositive static method returns false', function() {
    chai.expect(Lambda.isErrorFalsePositive(negativeError)).to.be.equal(false);
  });

  test('Check DEFAULT_TIMEOUT static getter returns value above 0', function() {
    chai.expect(Lambda.DEFAULT_TIMEOUT).to.be.above(0);
  });

  test('Check DEFAULT_MEMORY_LIMIT static getter returns value above 0', function() {
    chai.expect(Lambda.DEFAULT_MEMORY_LIMIT).to.be.above(0);
  });

  test('Check HANDLER static getter returns \'bootstrap.handler\'', function() {
    chai.expect(Lambda.HANDLER).to.be.equal('bootstrap.handler');
  });

  test('Check RUNTIME static getter returns \'nodejs\'', function() {
    chai.expect(Lambda.RUNTIME).to.be.equal('nodejs');
  });

  test('Check CONFIG_FILE static getter returns \'_config.json\'', function() {
    chai.expect(Lambda.CONFIG_FILE).to.be.equal('_config.json');
  });
});