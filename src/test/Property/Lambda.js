'use strict';

import chai from 'chai';
import {Lambda} from '../../lib.compiled/Property/Lambda';
import {PropertyInstanceMock} from '../mock/Property/PropertyInstanceMock';

suite('Property/Lambda', function() {

  let microserviceIdentifier = 'microserviceIdentifierTest';
  let identifier = 'lambdaIdentifierTest';
  let name = 'lambdaNameTest';
  let execRole = { Arn: 'executeRoleArn' };
  let path = 'Property';
  //propertyInstance.fakeBuild();
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

  test('Class Lambda exists in Property/Lambda', function() {
    chai.expect(typeof Lambda).to.equal('function');
  });

  //test('Class propertyInstance', function() {
  //  let error = null;
  //  let propertyInstance = null;
  //
  //  try {
  //    propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
  //  } catch (e) {
  //    error = e;
  //  }
  //    chai.expect(error).to.equal(null);
  //    chai.expect(propertyInstance).to.eql({});
  //});

  //test('Check constructor set valid default value for _uploadedLambda', function() {
  //  chai.expect(lambda.uploadedLambda).to.be.an.equal(null);
  //});
  //
  //test('Check zipPath getter returns valid value', function() {
  //  expectedResult = `${propertyInstance.path}/${microserviceIdentifier}_lambda_${identifier}.zip`;
  //  chai.expect(lambda.zipPath).to.be.equal(expectedResult);
  //});
  //
  //test('Check outputPath getter returns valid value', function() {
  //  chai.expect(lambda.outputPath).to.be.equal(propertyInstance.path);
  //});
  //
  //test('Check appIdentifier getter returns valid value', function() {
  //  chai.expect(lambda.appIdentifier).to.be.equal(propertyInstance.identifier);
  //});
  //
  //test('Check timeout getter returns valid value', function() {
  //  chai.expect(lambda.timeout).to.be.equal(Lambda.DEFAULT_TIMEOUT);
  //  lambda.timeout = timeoutInput;
  //  chai.expect(lambda.timeout).to.be.equal(timeoutInput);
  //  lambda.timeout = Lambda.DEFAULT_TIMEOUT;
  //});
  //
  //test('Check memorySize getter returns valid value', function() {
  //  chai.expect(lambda.memorySize).to.be.equal(Lambda.DEFAULT_MEMORY_LIMIT);
  //  lambda.memorySize = timeoutInput;
  //  chai.expect(lambda.memorySize).to.be.equal(timeoutInput);
  //});
  //
  //test('Check identifier getter returns valid value', function() {
  //  chai.expect(lambda.identifier).to.be.equal(identifier);
  //});
  //
  //test('Check path getter returns valid value', function() {
  //  chai.expect(lambda.path).to.be.equal(path);
  //});
  //
  //test('Check createConfigHookData getter returns valid value', function() {
  //  let configHookDataExpectedResult = {
  //    CodeSize: 0,
  //    Description: '',
  //    FunctionArn: `arn:aws:lambda:${lambda.region}:${lambda.awsAccountId}:function:${lambda.functionName}`,
  //    FunctionName: lambda.functionName,
  //    Handler: 'bootstrap.handler',
  //    LastModified: new Date().toISOString(),
  //    MemorySize: lambda._memorySize,
  //    Role: lambda._execRole.Arn,
  //    Runtime: lambda.runtime,
  //    Timeout: lambda._timeout,
  //  };
  //  chai.expect(lambda.createConfigHookData.CodeSize).to.be.equal(configHookDataExpectedResult.CodeSize);
  //  chai.expect(lambda.createConfigHookData.Description).to.be.equal(configHookDataExpectedResult.Description);
  //  chai.expect(lambda.createConfigHookData.FunctionArn).to.be.equal(configHookDataExpectedResult.FunctionArn);
  //  chai.expect(lambda.createConfigHookData.FunctionName).to.be.equal(configHookDataExpectedResult.FunctionName);
  //  chai.expect(lambda.createConfigHookData.Handler).to.be.equal(configHookDataExpectedResult.Handler);
  //  chai.expect(lambda.createConfigHookData.MemorySize).to.be.equal(configHookDataExpectedResult.MemorySize);
  //  chai.expect(lambda.createConfigHookData.Role).to.be.equal(configHookDataExpectedResult.Role);
  //  chai.expect(lambda.createConfigHookData.Runtime).to.be.equal(configHookDataExpectedResult.Runtime);
  //  chai.expect(lambda.createConfigHookData.Timeout).to.be.equal(configHookDataExpectedResult.Timeout);
  //});
  //
  //test('Check HANDLER static getter returns \'bootstrap.handler\'', function() {
  //  chai.expect(lambda.handler).to.be.equal('bootstrap.handler');
  //});

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


  test('Check RUNTIMES static getter returns [\'nodejs\', \'java8\', \'python2.7\']', function() {
    chai.expect(Lambda.RUNTIMES.length).to.be.equal(3);
    chai.expect(Lambda.RUNTIMES).to.be.includes('nodejs');
    chai.expect(Lambda.RUNTIMES).to.be.includes('java8');
    chai.expect(Lambda.RUNTIMES).to.be.includes('python2.7');
  });

  test('Check CONFIG_FILE static getter returns \'_config.json\'', function() {
    chai.expect(Lambda.CONFIG_FILE).to.be.equal('_config.json');
  });
});
