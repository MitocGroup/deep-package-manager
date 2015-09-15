'use strict';

import chai from 'chai';
import {AbstractService} from '../../../lib.compiled/Provisioning/Service/AbstractService';

// @todo: Add more advanced tests
suite('Provisioning/Service/AbstractService', function() {
  //let abstractService = new AbstractService('provisioning');

  test('Class AbstractService exists in Provisioning/Service/AbstractService', function() {
    chai.expect(typeof AbstractService).to.equal('function');
  });

  //test('Check AbstractService constructor sets valid default values', function() {
  //  let _configEmptyObject = {};
  //  chai.expect(abstractService.config()).to.equal(_configEmptyObject);
  //});

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
});