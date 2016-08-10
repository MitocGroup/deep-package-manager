'use strict';

import chai from 'chai';
import {CognitoIdentityService} from '../../../lib/Provisioning/Service/CognitoIdentityService';
import {APIGatewayService} from '../../../lib/Provisioning/Service/APIGatewayService';
import Core from 'deep-core';
import {ObjectStorage} from 'deep-core/lib.compiled/Generic/ObjectStorage';
import {PropertyInstanceMock} from '../../mock/Property/PropertyInstanceMock';
import {ProvisioningInstanceMock} from '../../mock/Provisioning/ProvisioningInstanceMock';


suite('Provisioning/Service/CognitoIdentityService', () => {
  let cognitoIdentityServiceInstance = null;
  let propertyInstance = null;
  let provisioningInstance = null;
  let objectStorageInput = null;
  let objectStorage = null;

  test('Class CognitoIdentityService exists in Provisioning/Service/CognitoIdentityService', () => {
    chai.expect(CognitoIdentityService).to.be.an('function');
  });

  test('Check constructor sets valid default values', () => {
    objectStorageInput = [{firstItem: 'value0'}, {secondItem: 'value1'}];
    let e = null;
    try {
      objectStorage = new ObjectStorage(objectStorageInput);
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      cognitoIdentityServiceInstance = new CognitoIdentityService(provisioningInstance);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(cognitoIdentityServiceInstance._readyTeardown).to.be.equal(false);
    chai.expect(cognitoIdentityServiceInstance._ready).to.be.equal(false);
  });

  test('Check name() method returns \'cognito-identity\'', () => {
    chai.expect(cognitoIdentityServiceInstance.name()).to.be.equal('cognito-identity');
  });

  test('Check AVAILABLE_REGIONS() static method returns array of available regions', () => {
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS).to.be.an('array');
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ASIA_PACIFIC_TOKYO);
  });

  test('Check ROLE_AUTH static getter returns \'authenticated\'', () => {
    chai.expect(CognitoIdentityService.ROLE_AUTH).to.be.equal('authenticated');
  });

  test('Check ROLE_UNAUTH static getter returns \'unauthenticated\'', () => {
    chai.expect(CognitoIdentityService.ROLE_UNAUTH).to.be.equal('unauthenticated');
  });

  test('Check ROLE_TYPES() static getter returns array of available regions', () => {
    chai.expect(CognitoIdentityService.ROLE_TYPES.length).to.be.equal(2);
    chai.expect(CognitoIdentityService.ROLE_TYPES).to.be.include(CognitoIdentityService.ROLE_AUTH);
    chai.expect(CognitoIdentityService.ROLE_TYPES).to.be.include(CognitoIdentityService.ROLE_UNAUTH);
  });

  test('Check _setup() method returns this._ready="true" for isUpdate', () => {
    let e = null;
    cognitoIdentityServiceInstance._ready = false;
    cognitoIdentityServiceInstance._isUpdate = true;
    let actualResult = null;

    try {
      actualResult =  cognitoIdentityServiceInstance._setup(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown="true" for isUpdate', () => {
    let e = null;
    cognitoIdentityServiceInstance._readyTeardown = false;
    cognitoIdentityServiceInstance._isUpdate = true;
    let actualResult = null;

    try {
      actualResult =  cognitoIdentityServiceInstance._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _setIdentityPoolRoles() method sets identity pool roles', () => {
    let e = null;
    let actualResult = null;

    try {
      actualResult =  cognitoIdentityServiceInstance._setIdentityPoolRoles('us-east-1:8954338ef-5443-5645-test-3543543');
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
  });

  test('Check _updateCognitoRolesPolicy() method updates cognito roles policy', () => {
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

    let apiGateway = provisioningInstance.services.find(APIGatewayService);
    let cognitoIdentityService = provisioningInstance.services.find(CognitoIdentityService);

    apiGateway.injectConfig({
      api: {
        id: 'us-east-1_fakeId',
      },
    });

    cognitoIdentityService.injectConfig({
      identityPool: {
        IdentityPoolId: 'test_IdentityPoolId',
      },
    });

    try {
      actualResult = cognitoIdentityService._updateCognitoRolesPolicy(roles);
    } catch (exception) {
      e = exception;
    }

    //todo - need to add additional checks
    chai.expect(e).to.be.equal(null);
  });
});
