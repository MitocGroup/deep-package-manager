'use strict';

import chai from 'chai';
import {CognitoIdentityService} from '../../../lib.compiled/Provisioning/Service/CognitoIdentityService';
import Core from '@mitocgroup/deep-core';

suite('Provisioning/Service/CognitoIdentityService', function() {
  let cognitoIdentityService = new CognitoIdentityService();

  test('Class CognitoIdentityService exists in Provisioning/Service/CognitoIdentityService', function() {
    chai.expect(typeof CognitoIdentityService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(cognitoIdentityService._readyTeardown).to.be.equal(false);
    chai.expect(cognitoIdentityService._ready).to.be.equal(false);
  });

  test('Check name() method returns \'cognito-identity\'', function() {
    chai.expect(cognitoIdentityService.name()).to.be.equal('cognito-identity');
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS.length).to.be.equal(2);
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(CognitoIdentityService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check DEVELOPER_PROVIDER_NAME static getter returns \'deep.mg\'', function() {
    chai.expect(CognitoIdentityService.DEVELOPER_PROVIDER_NAME).to.be.equal('deep.mg');
  });

  test('Check ROLE_AUTH static getter returns \'authenticated\'', function() {
    chai.expect(CognitoIdentityService.ROLE_AUTH).to.be.equal('authenticated');
  });

  test('Check ROLE_UNAUTH static getter returns \'unauthenticated\'', function() {
    chai.expect(CognitoIdentityService.ROLE_UNAUTH).to.be.equal('unauthenticated');
  });

  test('Check ROLE_TYPES() static getter returns array of available regions', function() {
    chai.expect(CognitoIdentityService.ROLE_TYPES.length).to.be.equal(2);
    chai.expect(CognitoIdentityService.ROLE_TYPES).to.be.include(CognitoIdentityService.ROLE_AUTH);
    chai.expect(CognitoIdentityService.ROLE_TYPES).to.be.include(CognitoIdentityService.ROLE_UNAUTH);
  });
});