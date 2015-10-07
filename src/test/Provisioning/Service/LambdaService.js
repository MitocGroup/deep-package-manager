'use strict';

import chai from 'chai';
import {LambdaService} from '../../../lib.compiled/Provisioning/Service/LambdaService';
import Core from 'deep-core';

suite('Provisioning/Service/LambdaService', function() {
  let lambdaServiceInstance = new LambdaService();

  test('Class LambdaService exists in Provisioning/Service/LambdaService', function() {
    chai.expect(typeof LambdaService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(lambdaServiceInstance._readyTeardown).to.be.equal(false);
    chai.expect(lambdaServiceInstance._ready).to.be.equal(false);
  });

  test('Check name() method returns \'lambda\'', function() {
    chai.expect(lambdaServiceInstance.name()).to.be.equal('lambda');
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.an('array');
    chai.expect(LambdaService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    lambdaServiceInstance._ready = false;
    let actualResult = lambdaServiceInstance._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check getExecRolePolicy() method', () => {
    //chai.expect(lambdaServiceInstance.getExecRolePolicy()).to.be.an.instanceOf(Core.AWS.IAM.Policy);
  });
});
