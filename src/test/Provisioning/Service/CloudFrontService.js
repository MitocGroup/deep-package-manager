'use strict';

import chai from 'chai';
import {CloudFrontService} from '../../../lib.compiled/Provisioning/Service/CloudFrontService';
import Core from '@mitocgroup/deep-core';

suite('Provisioning/Service/CloudFrontService', function() {
  let cloudFrontService = new CloudFrontService();

  test('Class CloudFrontService exists in Provisioning/Service/CloudFrontService', function() {
    chai.expect(typeof CloudFrontService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(cloudFrontService._readyTeardown).to.be.false;
    chai.expect(cloudFrontService._ready).to.be.false;
  });

  test('Check name() method returns \'cloudfront\'', function() {
    chai.expect(cloudFrontService.name()).to.be.equal('cloudfront');
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(CloudFrontService.AVAILABLE_REGIONS.length).to.be.equal(1);
    chai.expect(CloudFrontService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ANY);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    cloudFrontService._ready = false;
    let actualResult = cloudFrontService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});