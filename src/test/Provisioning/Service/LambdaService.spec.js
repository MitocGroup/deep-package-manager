'use strict';

import chai from 'chai';
import {LambdaService} from '../../../lib/Provisioning/Service/LambdaService';
import Core from 'deep-core';
import {ObjectStorage} from 'deep-core/lib.compiled/Generic/ObjectStorage';
import {PropertyInstanceMock} from '../../mock/Property/PropertyInstanceMock.js';
import {ProvisioningInstanceMock} from '../../mock/Provisioning/ProvisioningInstanceMock';

suite('Provisioning/Service/LambdaService', () => {
  let lambdaServiceInstance = null;
  let objectStorageInput = null;
  let objectStorage = null;
  let propertyInstance = null;
  let provisioningInstance = null;

  test('Class LambdaService exists in Provisioning/Service/LambdaService', () => {
    chai.expect(typeof LambdaService).to.equal('function');
  });

  test('Check constructor sets valid default values', () => {
    objectStorageInput = [{firstItem: 'value0'}, {secondItem: 'value1'},];
    let e = null;
    try {
      objectStorage = new ObjectStorage(objectStorageInput);
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      lambdaServiceInstance = new LambdaService(provisioningInstance);
    } catch (exception) {
      e = exception;
    }

    chai.expect(lambdaServiceInstance._readyTeardown).to.be.equal(false);
    chai.expect(lambdaServiceInstance._ready).to.be.equal(false);
  });

  test('Check name() method returns \'lambda\'', () => {
    chai.expect(lambdaServiceInstance.name()).to.be.equal('lambda');
  });

  test('Check AVAILABLE_REGIONS() static method returns array of available regions', () => {
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.an('array');
    chai.expect(LambdaService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
    chai.expect(LambdaService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check _postDeployProvision() method returns this._ready="true" for isUpdate', () => {
    let e = null;
    lambdaServiceInstance._ready = false;
    lambdaServiceInstance._isUpdate = true;
    let actualResult = null;

    try {
      actualResult = lambdaServiceInstance._postDeployProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready="true" for !isUpdate', () => {
    let e = null;
    lambdaServiceInstance._ready = false;
    lambdaServiceInstance._isUpdate = false;
    let actualResult = null;

    try {
      actualResult = lambdaServiceInstance._postDeployProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns instance with this._readyTeardown = true for !isUpdate', () => {
    let e = null;
    lambdaServiceInstance._isUpdate = false;
    lambdaServiceInstance._readyTeardown = false;
    let actualResult = null;

    try {

      actualResult = lambdaServiceInstance._postProvision(objectStorage);
    } catch (exception) {
      e = exception;
    }

    // todo - add buckets to testMaterials
    //chai.expect(e).to.be.equal(null);
    //chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });
});
