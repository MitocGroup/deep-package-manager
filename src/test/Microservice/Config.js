'use strict';

import chai from 'chai';
import {Config} from '../../lib.compiled/Microservice/Config';

suite('Microservice/Config', function() {
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

  test('Class Config exists in Microservice/Config', function() {
    chai.expect(typeof Config).to.equal('function');
  });

  test('Check constructor sets valid default value for _rawConfig={}', function() {
    chai.expect(config.rawConfig).to.be.eql(configInput);
  });

  test('Check constructor sets valid default value for _parsedObject', function() {
    chai.expect(config._parsedObject).to.be.eql({error: null, value: configInput});
  });

  test('Check extract method returns valid value', function() {
    chai.expect(config.extract()).to.be.eql(configInput);
  });

  test('Check rawconfig getter returns valid value', function() {
    chai.expect(config.rawConfig).to.be.eql(configInput);
    configInput.description = 'Test getter';
    chai.expect(config.rawConfig).to.be.eql(configInput);
  });

  test('Check valid getter returns true', function() {
    chai.expect(config.valid).to.be.equal(true);
  });

  test('Check error getter returns null', function() {
    chai.expect(config.error).to.be.equal(null);
  });

  test('Check error getter returns null', function() {
    let invalidConfigInput = {
      name: 'config',
    };

    config = new Config(invalidConfigInput);
  });
});
