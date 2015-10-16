'use strict';

import chai from 'chai';
import {AbstractService} from '../../../lib.compiled/Provisioning/Service/AbstractService';
import {Exception} from '../../../lib.compiled/Exception/Exception';

/**
 * Provisioning service
 * @description implements AbstractService to test it
 */
class ProvisioningService extends AbstractService {
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
    super.setup(services);
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {Service}
   */
  _postProvision(services) {
    super.setup(services);
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _postDeployProvision(services) {
    super.postDeployProvision(services);
  }

}

suite('Provisioning/Service/AbstractService', function() {
  let provisioningInput = 'provisioning';
  let service = new ProvisioningService(provisioningInput);

  test('Class AbstractService exists in Provisioning/Service/AbstractService', function() {
    chai.expect(typeof AbstractService).to.equal('function');
  });

  test('Check AbstractService constructor sets valid default values for _readyTeardown=false', function() {
    chai.expect(service.readyTeardown).to.equal(false);
  });

  test('Check AbstractService constructor sets valid default values for _ready=false', function() {
    chai.expect(service.ready).to.equal(false);
  });

  test('Check AbstractService constructor sets valid default values for _provisioning', function() {
    chai.expect(service.provisioning).to.equal(provisioningInput);
  });

  test('Check AbstractService constructor sets valid default values for _config={}', function() {
    chai.expect(service.config()).to.eql({});
  });

  test('Check DELIMITER_UPPER_CASE static getter returns \'upperCase\'', function() {
    chai.expect(AbstractService.DELIMITER_UPPER_CASE).to.be.equal('upperCase');
  });

  test('Check DELIMITER_DOT static getter returns \'.\'', function() {
    chai.expect(AbstractService.DELIMITER_DOT).to.be.equal('.');
  });

  test('Check DELIMITER_UNDERSCORE static getter returns \'_\'', function() {
    chai.expect(AbstractService.DELIMITER_UNDERSCORE).to.be.equal('_');
  });

  test('Check AWS_RESOURCES_PREFIX static getter returns \'deep\'', function() {
    chai.expect(AbstractService.AWS_RESOURCES_PREFIX).to.be.equal('deep');
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
});
