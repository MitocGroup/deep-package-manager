'use strict';

import chai from 'chai';
import {Instance} from '../../lib.compiled/Microservice/Instance';
import {InvalidArgumentException} from '../../lib.compiled/Exception/InvalidArgumentException';
import Core from '@mitocgroup/deep-core';
import {Parameters} from '../../lib.compiled/Microservice/Parameters';
import {Config} from '../../lib.compiled/Microservice/Config';

suite('Microservice/Instance', function() {
  let configInput = {
    name: 'config',
    propertyRoot: false,
    description: 'Config unit test',
    identifier: 'unit_test',
    version: '0.0.1',
    website: 'http://www.mitocgroup.com/',
    email: 'hello@mitocgroup.com',
    dependencies: {},
    autoload: {
      backend: 'Backend',
      docs: 'Docs',
      frontend: 'Frontend',
      models: 'Models',
    },
  };
  let config = new Config(configInput);
  let parameters = new Parameters();

  let instance = new Instance(config, parameters, 'basePath');

  test('Class Instance exists in Microservice/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });

  //test('Check constructor sets valid default values', function() {
  //  chai.expect(instance._readyTeardown).to.be.false;
  //  chai.expect(instance._ready).to.be.false;
  //});
  //
  //test('Check name() method returns \'apigateway\'', function() {
  //  chai.expect(instance.name()).to.be.equal('apigateway');
  //});

  ////todo - TBD
  //test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
  //  chai.expect(instance.AVAILABLE_REGIONS.length).to.be.equal(3);
  //  chai.expect(instance.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
  //  chai.expect(instance.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
  //  chai.expect(instance.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  //});
  //
  //test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
  //  chai.expect(instance._readyTeardown).to.be.equal(false);
  //  let actualResult = instance._postProvision('service');
  //  chai.expect(actualResult._readyTeardown).to.be.equal(true);
  //});
  //
  //test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
  //  instance._ready = false;
  //  let actualResult = instance._postDeployProvision('service');
  //  chai.expect(actualResult._ready).to.be.equal(true);
  //});
});