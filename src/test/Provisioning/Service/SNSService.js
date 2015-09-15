'use strict';

import chai from 'chai';
import {SNSService} from '../../../lib.compiled/Provisioning/Service/SNSService';
import Core from '@mitocgroup/deep-core';

suite('Provisioning/Service/SNSService', function() {
  let snsService = new SNSService();

  test('Class SNSService exists in Provisioning/Service/SNSService', function() {
    chai.expect(typeof SNSService).to.equal('function');
  });

  test('Check name() static method returns \'sns\'', function() {
    chai.expect(snsService.name()).to.be.equal('sns');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(snsService._readyTeardown).to.be.equal(false);
    chai.expect(snsService._ready).to.be.equal(false);
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(SNSService.AVAILABLE_REGIONS[0].length).to.be.equal(10);
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('*');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('ap-northeast-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('ap-southeast-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('ap-southeast-2');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('eu-central-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('eu-west-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('sa-east-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('us-east-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('us-west-1');
    chai.expect(SNSService.AVAILABLE_REGIONS[0]).to.be.include('us-west-2');
  });

  test('Check _setup() method returns this._ready=\'true\'', function() {
    chai.expect(snsService._ready).to.be.equal(false);
    let actualResult = snsService._setup('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
    chai.expect(snsService._readyTeardown).to.be.equal(false);
    let actualResult = snsService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    snsService._ready = false;
    let actualResult = snsService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});