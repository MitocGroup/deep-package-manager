'use strict';

import chai from 'chai';
import {Config} from '../../lib/Microservice/Config';
import {InvalidConfigException} from '../../lib/Microservice/Exception/InvalidConfigException';

suite('Microservice/Config', () => {
  let configInput = {
    name: 'config',
    propertyRoot: false,
    description: 'Config unit test',
    identifier: 'unit_test',
    frontendEngine: ['angular'],
    version: '0.0.1',
    dependencies: {},
    tags: [],
    autoload: {
      backend: 'Backend',
      docs: 'Docs',
      frontend: 'Frontend',
      models: 'Data/Models',
      validation: 'Data/Validation',
      fixtures: 'Data/Fixtures',
      migration: 'Data/Migration',
      roles: 'Data/Roles',
    },
  };

  let config = new Config(configInput);

  test('Class Config exists in Microservice/Config', () => {
    chai.expect(Config).to.be.an('function');
  });

  test('Check constructor sets valid default value for _rawConfig={}', () => {
    chai.expect(config.rawConfig).to.be.eql(configInput);
  });

  test('Check constructor sets valid default value for _parsedObject', () => {
    chai.expect(config._parsedObject).to.be.eql({error: null, value: configInput});
  });

  test('Check extract method returns valid value', () => {
    chai.expect(config.extract()).to.be.eql(configInput);
  });

  test('Check rawconfig getter returns valid value', () => {
    chai.expect(config.rawConfig).to.be.eql(configInput);
    configInput.description = 'Test getter';
    chai.expect(config.rawConfig).to.be.eql(configInput);
  });

  test('Check valid getter returns true', () => {
    chai.expect(config.valid).to.be.equal(true);
  });

  test('Check error getter returns null', () => {
    chai.expect(config.error).to.be.equal(null);
  });

  test('Check extract() method throws InvalidConfigException exception', () => {
    let error = null;
    let invalidConfigInput = {
      name: 'config',
    };
    config = new Config(invalidConfigInput);
    try {
      config.extract();
    } catch (e) {
      error = e;
      chai.expect(error).to.be.an.instanceOf(InvalidConfigException);
    }
  });
});
