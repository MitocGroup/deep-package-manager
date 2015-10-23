'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {APIGatewayService} from '../../../lib.compiled/Provisioning/Service/APIGatewayService';
import {ProvisioningInstanceMock} from '../../../mock/Provisioning/ProvisioningInstanceMock';
import {PropertyInstanceMock} from '../../../mock/Property/PropertyInstanceMock';
import Core from 'deep-core';
import {ObjectStorage} from 'deep-core/lib.compiled/Generic/ObjectStorage';

chai.use(sinonChai);

suite('Provisioning/Service/APIGatewayService', function() {
  let apiGatewayService = new APIGatewayService();
  let objectStorageInput = null;
  let objectStorage = null;

  test('Class APIGatewayService exists in Provisioning/Service/APIGatewayService', function() {
    chai.expect(typeof APIGatewayService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    let error = null;
    let propertyInstance;
    let provisioningInstance;
    objectStorageInput = [{firstItem: 'value0'}, {secondItem: 'value1'}];
    try {
      objectStorage = new ObjectStorage(objectStorageInput);
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      apiGatewayService = new APIGatewayService(provisioningInstance);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.equal(null);
    chai.expect(apiGatewayService._readyTeardown).to.be.equal(false);
    chai.expect(apiGatewayService._ready).to.be.equal(false);
  });

  test(`Check name() method returns \'${Core.AWS.Service.API_GATEWAY}\'`, function() {
    chai.expect(apiGatewayService.name()).to.be.equal(Core.AWS.Service.API_GATEWAY);
  });

  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(APIGatewayService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(APIGatewayService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(APIGatewayService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
    chai.expect(APIGatewayService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
    chai.expect(apiGatewayService._readyTeardown).to.be.equal(false);
    let actualResult = apiGatewayService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check getMethodJsonTemplate() method returns {\'application/json\':\'\'}', function() {
    let expectedResult = {
      'application/json': '',
    };
    chai.expect(apiGatewayService.getMethodJsonTemplate()).to.be.eql(expectedResult);
  });

  test('Check getMethodJsonTemplate() method returns valid object', function() {
    let expectedResult = {
      'application/json': '{"statusCode": 200}',
    };
    chai.expect(apiGatewayService.getMethodJsonTemplate('OPTIONS')).to.be.eql(expectedResult);
  });

  test('Check ALLOWED_CORS_HEADERS static getter returns valid string', function() {
    chai.expect(APIGatewayService.ALLOWED_CORS_HEADERS).to.be.equal("'Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization'");
  });

  test('Check jsonEmptyModel getter returns valid { "application/json": "Empty" }', function() {
    let expectedResult = {
      'application/json': 'Empty',
    };
    chai.expect(apiGatewayService.jsonEmptyModel).to.be.eql(expectedResult);
  });

  test('Check _getIntegrationTypeParams getter for httpMethod === "OPTIONS"', function() {
    let expectedResult = {
      type: 'MOCK',
      requestTemplates: {
        'application/json':  '{"statusCode": 200}',
      },
    };
    let type = 'testType';
    let httpMethod = 'OPTIONS';
    let uri = 'http://deep.mg';
    chai.expect(apiGatewayService._getIntegrationTypeParams(type, httpMethod, uri)).to.be.eql(expectedResult);
  });

  test('Check _getIntegrationTypeParams getter for httpMethod !== "OPTIONS"', function() {
    let type = 'testType';
    let httpMethod = 'GET';
    let uri = 'http://deep.mg';
    let expectedResult = {
      type: type,
      uri: uri,
      integrationHttpMethod: httpMethod,
      requestTemplates: {
        'application/json': '',
      },
    };
    chai.expect(apiGatewayService._getIntegrationTypeParams(type, httpMethod, uri)).to.be.eql(expectedResult);
  });

  test('Check stageName getter returns valid value', function() {
    chai.expect(apiGatewayService.stageName).to.be.eql('test');
  });

  test('Check _updateCognitoRolesPolicy() method updates cognito roles policy', function() {
    let e = null;
    let actualResult = null;

    try {
      actualResult =  apiGatewayService._createApiResources('resourcePaths', 'restApiId', 'callback');
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
  });

  test('Check _setup() method returns this._ready="true" for isUpdate', function() {
    let e = null;
    apiGatewayService._ready = false;
    apiGatewayService._isUpdate = true;
    let actualResult = null;

    try {
      actualResult =  apiGatewayService._setup(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown="true" for isUpdate', function() {
    let e = null;
    apiGatewayService._readyTeardown = false;
    apiGatewayService._isUpdate = true;
    let actualResult = null;

    try {
      actualResult =  apiGatewayService._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _createApiIamRole() method', function() {
    let e = null;
    let actualResult = null;
    let spyCallback = sinon.spy();

    try {
      actualResult =  apiGatewayService._createApiIamRole(spyCallback);
    } catch (exception) {
      e = exception;
    }

    //todo - need to create mocks for async methods
    chai.expect(e).to.be.equal(null);
  });

  test('Check _deployApi() method', function() {
    let e = null;
    let actualResult = null;
    let spyCallback = sinon.spy();
    let apiId = 'apiId_test';

    try {
      actualResult =  apiGatewayService._deployApi(apiId, spyCallback);
    } catch (exception) {
      e = exception;
    }

    //todo - need to create mocks for async methods
    chai.expect(e).to.be.equal(null);
  });

  test('Check _addPolicyToApiRole() method', function() {
    let e = null;
    let actualResult = null;
    let spyCallback = sinon.spy();
    let apiRole = {
      Path: '/',
      RoleName: 'DeepDevAuthenticatedc5Test',
      RoleId: 'AROTEST',
      Arn: 'arn:aws:iam::509137608280:role/DeepDevAuthenticatedc5Test',
      CreateDate: '2015-09-10T08:05:18.829Z',
      AssumeRolePolicyDocument: '%7B%22Version%22%3A%222012-10-17%22%2C%22Statement%22%3A%5B%7B%22Effect%22%3A%22' +
      'Allow%22%2C%22Action%22%3A%5B%22sts%3AAssumeRoleWithWebIdentity%22%5D%2C%22Condition%22%3A%7B%22' +
      'StringEquals%22%3A%7B%22cognito-identity.amazonaws.com%3Aaud%22%3A%22' +
      'us-east-1%3A894d38ef-7eaalue%3AStringLike%22%3A%7B%22' +
      'cognito-identity.amazonaws.com%3Aamr%22%3A%22authenticated%22%7D%7D%2C%22' +
      'Principal%22%3A%7B%22Federated%22%3A%22cognito-identity.amazonaws.com%22%7D%7D%5D%7D',
    };
    let lambdaARNs = ['arn:aws:lambda:us-west-2:test_awsAccountId:function:testFunctionName1',
      'arn:aws:lambda:us-west-2:test_awsAccountId:function:testFunctionName2'];

    try {
      actualResult =  apiGatewayService._addPolicyToApiRole(apiRole, lambdaARNs, spyCallback);
    } catch (exception) {
      e = exception;
    }

    //todo - need to create mocks for async methods
    chai.expect(e).to.be.equal(null);
  });

  test('Check getResourcesIntegrationParams() method retrurns valid integrationParams', function() {
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
      actualResult =  apiGatewayService.getResourcesIntegrationParams(microservicesConfig);
    } catch (exception) {
      e = exception;
    }

    // todo - need to add smart checks
  });
});
