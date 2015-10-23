'use strict';

import chai from 'chai';
import {LambdaService} from '../../../lib.compiled/Provisioning/Service/LambdaService';
import Core from 'deep-core';
import {ObjectStorage} from 'deep-core/lib.compiled/Generic/ObjectStorage';
import {Policy} from 'deep-core/lib.compiled/AWS/IAM/Policy';
import {InstanceMock} from '../../../mock/deep-kernel/Microservice/InstanceMock';
import {PropertyInstanceMock} from '../../../mock/Property/PropertyInstanceMock.js';
import {ProvisioningInstanceMock} from '../../../mock/Provisioning/ProvisioningInstanceMock';

suite('Provisioning/Service/LambdaService', function() {
  let lambdaServiceInstance = null;
  let objectStorageInput = null;
  let objectStorage = null;
  let propertyInstance = null;
  let provisioningInstance = null;

  test('Class LambdaService exists in Provisioning/Service/LambdaService', function() {
    chai.expect(typeof LambdaService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    objectStorageInput = [{firstItem: 'value0'}, {secondItem: 'value1'}];
    let e = null;
    try {
      objectStorage = new ObjectStorage(objectStorageInput);
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      lambdaServiceInstance = new LambdaService(provisioningInstance);
    } catch (exception) {
      e = exception;
    }

    chai.expect(lambdaServiceInstance._readyTeardown).to.be.equal(false);
    chai.expect(lambdaServiceInstance._ready).to.be.equal(false);
  });

  test('Check name() method returns \'lambda\'', function() {
    chai.expect(lambdaServiceInstance.name()).to.be.equal('lambda');
  });

  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.an('array');
    chai.expect(LambdaService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check _postDeployProvision() method returns this._ready="true" for isUpdate', function() {
    let e = null;
    lambdaServiceInstance._ready = false;
    lambdaServiceInstance._isUpdate = true;
    let actualResult = null;

    try {
      actualResult = lambdaServiceInstance._postDeployProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready="true" for !isUpdate', function() {
    let e = null;
    lambdaServiceInstance._ready = false;
    lambdaServiceInstance._isUpdate = false;
    let actualResult = null;

    try {
      actualResult = lambdaServiceInstance._postDeployProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _setup() method returns instance with this._ready = true', function() {
    let e = null;
    lambdaServiceInstance._isUpdate = true;
    lambdaServiceInstance._ready = false;
    let actualResult = null;

    try {
      actualResult = lambdaServiceInstance._setup(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns instance with this._readyTeardown = true for isUpdate', function() {
    let e = null;
    lambdaServiceInstance._isUpdate = true;
    lambdaServiceInstance._readyTeardown = false;
    let actualResult = null;

    try {
      actualResult = lambdaServiceInstance._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postProvision() method returns instance with this._readyTeardown = true for !isUpdate', function() {
    let e = null;
    lambdaServiceInstance._isUpdate = false;
    lambdaServiceInstance._readyTeardown = false;
    let actualResult = null;

    try {

      actualResult = lambdaServiceInstance._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    // todo - add buckets to testMaterials
    //chai.expect(e).to.be.equal(null);
    //chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check generateAllowInvokeFunctionPolicy() method returns policy', function() {
    let e = null;
    let actualResult = null;
    let lambdaARNs = ['arn:aws:lambda:us-west-2:test_awsAccountId:function:testFunctionName1',
      'arn:aws:lambda:us-west-2:test_awsAccountId:function:testFunctionName2',];

    try {
      actualResult = LambdaService.generateAllowInvokeFunctionPolicy(lambdaARNs);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.assert.instanceOf(actualResult, Policy, 'actualResult is an instance of Policy');
  });

  test('Check getAllLambdasArn() method returns valid lambdaArns array', function() {
    let e = null;
    let actualResult = null;
    let microservicesConfig = {
      'deep.ng.test': {
        isRoot: false,
        parameters: {},
        resources: {
          test: {
            create: {
              identifier: 'create-test',
              description: 'Lambda for creating test',
              type: 'lambda',
              methods: [
                'POST',
              ],
              source: 'src/test/Create',
            },
            retrieve: {
              identifier: 'retrieve-test',
              description: 'Retrieves test',
              type: 'lambda',
              methods: ['GET'],
              source: 'src/test/Retrieve',
            },
            delete: {
              identifier: 'delete-test',
              description: 'Lambda for deleting test',
              type: 'lambda',
              methods: ['DELETE'],
              source: 'src/test/Delete',
            },
            update: {
              identifier: 'update-test',
              description: 'Update test',
              type: 'lambda',
              methods: ['PUT'],
              source: 'src/test/Update',
            },
          },
        },
        deployedServices: {
          lambdas: {
            'create-test': {
              FunctionArn: 'FunctionArnCreate-Test',
            },
            'delete-test': {
              FunctionArn: 'FunctionArnDelete-Test',
            },
            'update-test': {
              FunctionArn: 'FunctionArnUpdate-Test',
            },
            'retrieve-test': {
              FunctionArn: 'FunctionArnRetrieve-Test',
            },
          },
        },
      },
    };

    try {
      actualResult = LambdaService.getAllLambdasArn(microservicesConfig);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult).to.be.an('array');
    chai.expect(actualResult.length).to.be.equal(4);
    chai.expect(actualResult).to.be.include(
      microservicesConfig['deep.ng.test'].deployedServices.lambdas['create-test'].FunctionArn);
  });

  test('Check getAllLambdasArn() method returns valid lambdaArns array', function() {
    let e = null;
    let actualResult = null;
    let roles = {
      authenticated: {
        Path: '/',
        RoleName: 'DeepDevAuthenticatedc5Test',
        RoleId: 'AROTEST',
        Arn: 'arn:aws:iam::509137608280:role/DeepDevAuthenticatedc5Test',
        CreateDate: '2015-09-10T08:05:18.829Z',
        AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%5B%22sts%3AAssumeRoleWithWebIdentity%22%5D%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22cognito-identity.amazonaws.com%3Aaud%22%3A%22us-east-1%3A894d38ef-7eaa-4af8-bde4-f6310281f2db%22%7D%2C%22ForAnyValue%3AStringLike%22%3A%7B%22cognito-identity.amazonaws.com%3Aamr%22%3A%22authenticated%22%7D%7D%2C%22Principal%22%3A%7B%22Federated%22%3A%22cognito-identity.amazonaws.com%22%7D%7D%5D%7D',
      },
      unauthenticated: {
        Path: '/',
        RoleName: 'DeepDevUnauthenticatedc5Test',
        RoleId: 'AROTEST',
        Arn: 'arn:aws:iam::509137608280:role/DeepDevUnauthenticatedc5Test',
        CreateDate: '2015-09-10T08:05:18.914Z',
        AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22Allow%22%2C%22Action%22%3A%5B%22sts%3AAssumeRoleWithWebIdentity%22%5D%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22cognito-identity.amazonaws.com%3Aaud%22%3A%22us-east-1%3A894d38ef-7eaa-4af8-bde4-f6310281f2db%22%7D%2C%22ForAnyValue%3AStringLike%22%3A%7B%22cognito-identity.amazonaws.com%3Aamr%22%3A%22unauthenticated%22%7D%7D%2C%22Principal%22%3A%7B%22Federated%22%3A%22cognito-identity.amazonaws.com%22%7D%7D%5D%7D',
      },
    };
    let buckets = {
      system: {
        name: 'deep.dev.system.c516a862',
      },
      temp: {
        name: 'deep.dev.temp.c516a862',
      },
      public: {
        name: 'deep.dev.public.c516a862',
      },
    };
    let dynamoDbTablesNames = {
      Account: 'DeepDevAccountc516a862',
      ActivityLog: 'DeepDevActivityLogc516a862',
      Role: 'DeepDevRolec516a862',
      User: 'DeepDevUserc516a862',
      Billing: 'DeepDevBillingc516a862',
      Property: 'DeepDevPropertyc516a862',
    };

    try {
      actualResult = lambdaServiceInstance._attachPolicyToExecRoles(buckets, roles, dynamoDbTablesNames);
    } catch (exception) {
      e = exception;
    }

    //todo - add smart checks
  });
});
