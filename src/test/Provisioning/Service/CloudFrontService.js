'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {CloudFrontService} from '../../../lib.compiled/Provisioning/Service/CloudFrontService';
import Core from 'deep-core';

chai.use(sinonChai);

suite('Provisioning/Service/CloudFrontService', function() {
  let cloudFrontService = new CloudFrontService();
  let objectStorageInput = null;
  let objectStorage = null;
  let propertyInstance = null;
  let provisioningInstance = null;

  test('Class CloudFrontService exists in Provisioning/Service/CloudFrontService', function() {
    chai.expect(typeof CloudFrontService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    objectStorageInput = [{firstItem: 'value0'}, {secondItem: 'value1'},];
    let e = null;

    try {
      objectStorage = new ObjectStorage(objectStorageInput);
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      cloudFrontService = new CloudFrontService(provisioningInstance);
    } catch (exception) {
      e = exception;
    }

    chai.expect(cloudFrontService._readyTeardown).to.be.equal(false);
    chai.expect(cloudFrontService._ready).to.be.equal(false);
  });

  test('Check name() method returns \'cloudfront\'', function() {
    chai.expect(cloudFrontService.name()).to.be.equal('cloudfront');
  });

  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(CloudFrontService.AVAILABLE_REGIONS.length).to.be.equal(1);
    chai.expect(CloudFrontService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.ANY);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    cloudFrontService._ready = false;
    let actualResult = cloudFrontService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _setup() method returns instance with this._ready = true for isUpdate', function() {
    let e = null;
    cloudFrontService._isUpdate = true;
    cloudFrontService._ready = false;
    let actualResult = null;

    try {
      actualResult = cloudFrontService._setup(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns instance with this._readyTeardown = true for isUpdate', function() {
    let e = null;
    cloudFrontService._isUpdate = true;
    cloudFrontService._readyTeardown = false;
    let actualResult = null;

    try {
      actualResult = cloudFrontService._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postProvision() method returns instance with this._readyTeardown = true for !isUpdate', function() {
    let e = null;
    cloudFrontService._isUpdate = false;
    cloudFrontService._readyTeardown = false;
    let actualResult = null;

    try {
      actualResult = cloudFrontService._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    //TODO - TBD
    //chai.expect(e).to.be.equal(null);
    //chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });
});
