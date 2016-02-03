'use strict';

import chai from 'chai';
import {SNSService} from '../../../lib/Provisioning/Service/SNSService';

suite('Provisioning/Service/SNSService', () => {
  let snsService = new SNSService();

  test('Class SNSService exists in Provisioning/Service/SNSService', () => {
    chai.expect(typeof SNSService).to.equal('function');
  });

  test('Check name() static method returns \'sns\'', () => {
    chai.expect(snsService.name()).to.be.equal('sns');
  });

  test('Check constructor sets valid default values', () => {
    chai.expect(snsService._readyTeardown).to.be.equal(false);
    chai.expect(snsService._ready).to.be.equal(false);
  });

  test('Check _setup() method returns this._ready=\'true\'', () => {
    chai.expect(snsService._ready).to.be.equal(false);
    let actualResult = snsService._setup('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', () => {
    chai.expect(snsService._readyTeardown).to.be.equal(false);
    let actualResult = snsService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', () => {
    snsService._ready = false;
    let actualResult = snsService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});
