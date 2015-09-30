'use strict';

import chai from 'chai';
import {APIGatewayService} from '../../../lib.compiled/Provisioning/Service/APIGatewayService';
import Core from '@mitocgroup/deep-core';

suite('Provisioning/Service/APIGatewayService', function() {
  let apiGatewayService = new APIGatewayService();

  test('Class APIGatewayService exists in Provisioning/Service/APIGatewayService', function() {
    chai.expect(typeof APIGatewayService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(apiGatewayService._readyTeardown).to.be.equal(false);
    chai.expect(apiGatewayService._ready).to.be.equal(false);
  });

  test('Check name() method returns \'apigateway\'', function() {
    chai.expect(apiGatewayService.name()).to.be.equal('apigateway');
  });

  //todo - TBD
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

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    // @todo - _postDeployProvision is an async call
    //apiGatewayService._ready = false;
    //let actualResult = apiGatewayService._postDeployProvision('service');
    //chai.expect(actualResult._ready).to.be.equal(true);
  });
});
