'use strict';

import chai from 'chai';
import {AbstractService} from '../../../lib.compiled/Provisioning/Service/AbstractService';
import {Exception} from '../../../lib.compiled/Exception/Exception';
import {PropertyInstanceMock} from '../../../mock/Property/PropertyInstanceMock.js';
import {ProvisioningInstanceMock} from '../../../mock/Provisioning/ProvisioningInstanceMock';

class AbstractServiceTest extends AbstractService {
  /**
   * @param {Instance} provisioning
   */
  constructor(provisioning) {
    super(provisioning);
  }

  /**
   * @returns {String}
   */
  name() {
    return 'abstract-service';
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {Service}
   */
  _setup(services) {
    return services;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {Service}
   */
  _postProvision(services) {
    return services;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _postDeployProvision(services) {
    return services;
  }
}

suite('Provisioning/Service/AbstractService', function() {
  let provisioningInput = 'provisioning';
  let service = new AbstractServiceTest(provisioningInput);

  test('Class AbstractService exists in Provisioning/Service/AbstractService', function() {
    chai.expect(typeof AbstractServiceTest).to.equal('function');
  });

  test('Check AbstractService constructor sets valid default values for _readyTeardown=false', function() {
    chai.expect(service.readyTeardown).to.equal(false);
  });

  test('Check AbstractService constructor sets valid default values for _ready=false', function() {
    chai.expect(service.ready).to.equal(false);
  });

  test('Check AbstractService constructor sets valid default values for _isUpdate=false', function() {
    chai.expect(service.isUpdate).to.equal(false);
  });

  test('Check AbstractService constructor sets valid default values for _provisioning', function() {
    chai.expect(service.provisioning).to.equal(provisioningInput);
  });

  test('Check AbstractService constructor sets valid default values for _config={}', function() {
    chai.expect(service.config()).to.eql({});
  });

  test('Check DELIMITER_UPPER_CASE static getter returns \'upperCase\'', function() {
    chai.expect(AbstractServiceTest.DELIMITER_UPPER_CASE).to.be.equal('upperCase');
  });

  test('Check DELIMITER_DOT static getter returns \'.\'', function() {
    chai.expect(AbstractServiceTest.DELIMITER_DOT).to.be.equal('.');
  });

  test('Check DELIMITER_UNDERSCORE static getter returns \'_\'', function() {
    chai.expect(AbstractServiceTest.DELIMITER_UNDERSCORE).to.be.equal('_');
  });

  test('Check AWS_RESOURCES_PREFIX static getter returns \'deep\'', function() {
    chai.expect(AbstractServiceTest.AWS_RESOURCES_PREFIX).to.be.equal('deep');
  });

  test('Check getApiVersions for a service throws an exception when something is not ok an array', function() {
    let e = null;
    try {
      service.getApiVersions('S3');
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(Exception);
  });

  test('Check postProvision() method', function() {
    let e = null;
    try {
      service.postProvision('services');
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
  });

  test('Check isUpdate setter ', function() {
    service.isUpdate = false;
    chai.expect(service.isUpdate).to.equal(false);
    service.isUpdate = true;
    chai.expect(service.isUpdate).to.equal(true);
    service.isUpdate = false;
    chai.expect(service.isUpdate).to.equal(false);
  });

  test('Check generateAwsResourceName() method throws an exception when delimiter is not ok', function() {
    let e = null;
    let resourceName = 'test';
    let awsService = 'cloudfront';
    let msIdentifier = '';
    let delimiter = 'invalid delimiter';
    let propertyInstance = null;
    let provisioningInstance = null;

    try {
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      service = new AbstractServiceTest(provisioningInstance);
      service.generateAwsResourceName(resourceName, awsService, msIdentifier, delimiter);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.not.equal(null);
    chai.expect(e).to.be.an.instanceOf(Exception);
  });

  test('Check generateAwsResourceName() method', function() {
    let e = null;
    let resourceName = 'test';
    let awsService = 'cloudfront';
    let msIdentifier = '';
    let propertyInstance = null;
    let provisioningInstance = null;

    try {
      propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
      service = new AbstractServiceTest(provisioningInstance);
      service.generateAwsResourceName(resourceName, awsService, msIdentifier, AbstractService.DELIMITER_UNDERSCORE);
    } catch (exception) {
      e = exception;
    }

    //todo -  AssertionError: expected 'Naming limits for aws service cloudfront are not defined.' to equal 'Undefined'
  });
});
