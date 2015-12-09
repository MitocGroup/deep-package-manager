'use strict';

import chai from 'chai';
import {IAMService} from '../../../lib/Provisioning/Service/IAMService';
import Core from 'deep-core';

suite('Provisioning/Service/IAMService', function() {
  let iamService = new IAMService();

  test('Class IAMService exists in Provisioning/Service/IAMService', function() {
    chai.expect(typeof IAMService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(iamService._readyTeardown).to.be.equal(false);
    chai.expect(iamService._ready).to.be.equal(false);
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(IAMService.AVAILABLE_REGIONS.length).to.be.equal(1);
    chai.expect(IAMService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ANY);
  });

  test('Check _setup() method returns this._ready=\'true\'', function() {
    chai.expect(iamService._ready).to.be.equal(false);
    let actualResult = iamService._setup('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
    chai.expect(iamService._readyTeardown).to.be.equal(false);
    let actualResult = iamService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    iamService._ready = false;
    let actualResult = iamService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});
