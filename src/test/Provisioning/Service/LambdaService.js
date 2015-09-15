'use strict';

import chai from 'chai';
import {LambdaService} from '../../../lib.compiled/Provisioning/Service/LambdaService';
import Core from '@mitocgroup/deep-core';

suite('Provisioning/Service/LambdaService', function() {
  let lambdaService = new LambdaService();

  test('Class LambdaService exists in Provisioning/Service/LambdaService', function() {
    chai.expect(typeof LambdaService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(lambdaService._readyTeardown).to.be.false;
    chai.expect(lambdaService._ready).to.be.false;
  });

  test('Check name() method returns \'lambda\'', function() {
    chai.expect(lambdaService.name()).to.be.equal('lambda');
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(LambdaService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    lambdaService._ready = false;
    let actualResult = lambdaService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});