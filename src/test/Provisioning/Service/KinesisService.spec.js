'use strict';

import chai from 'chai';
import {KinesisService} from '../../../lib/Provisioning/Service/KinesisService';
import Core from 'deep-core';

suite('Provisioning/Service/KinesisService', () => {
  let kinesisService = new KinesisService();

  test('Class KinesisService exists in Provisioning/Service/KinesisService', () => {
    chai.expect(KinesisService).to.be.an('function');
  });

  test('Check constructor sets valid default values', () => {
    chai.expect(kinesisService._readyTeardown).to.be.equal(false);
    chai.expect(kinesisService._ready).to.be.equal(false);
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', () => {
    chai.expect(KinesisService.AVAILABLE_REGIONS.length).to.be.equal(8);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ASIA_PACIFIC_TOKYO);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ASIA_PACIFIC_SYDNEY);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ASIA_PACIFIC_SINGAPORE);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_FRANKFURT);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_N_CALIFORNIA);
    chai.expect(KinesisService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
  });

  test('Check _setup() method returns this._ready=\'true\'', () => {
    chai.expect(kinesisService._ready).to.be.equal(false);
    let actualResult = kinesisService._setup('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', () => {
    chai.expect(kinesisService._readyTeardown).to.be.equal(false);
    let actualResult = kinesisService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', () => {
    kinesisService._ready = false;
    let actualResult = kinesisService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});
