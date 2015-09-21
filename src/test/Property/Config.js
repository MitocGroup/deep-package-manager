'use strict';

import chai from 'chai';
import {Config} from '../../lib.compiled/Property/Config';
import appConfigSchema from '../../lib.compiled/Property/config.schema';
import Joi from 'joi';

suite('Property/Config', function() {
  let config = new Config();
  let defaultConfig = {
    error: [null],
    value: {
      aws: {
        accessKeyId: [null],
        region: [null],
        secretAccessKey: [null],
      },
      awsAccountId: 123456789012,
      env: 'dev',
      propertyIdentifier: '59e6913c9ed3afe744b5434817ce6345',
    },
  };

  let configName = 'test/Property/deeploy.test.json';

  test('Class Config exists in Property/Config', function() {
    chai.expect(typeof Config).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(config._rawConfig).to.be.eql({});

    //todo
    //chai.expect(config._parsedObject).to.be.eql('');
  });

  test('Check rawConfig  getter returns valid value', function() {
    chai.expect(config.rawConfig).to.be.eql({});
  });

  test('Check valid  getter returns true', function() {
    chai.expect(config.valid).to.be.equal(true);
  });

  test('Check error getter returns null', function() {
    chai.expect(config.error).to.be.equal(null);
  });

  test('Check DEFAULT_FILENAME static getter returns \'deeploy.json\'', function() {
    chai.expect(Config.DEFAULT_FILENAME).to.be.equal('deeploy.json');
  });

  test('Check createFromJsonFile() static method returns valid istance of Config class', function() {
    let extpectedResult = {
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

    chai.expect(Config.createFromJsonFile(configName).rawConfig).to.be.eql(extpectedResult);
  });

  test('Check extract() method returns valid value', function() {
    chai.expect(config.extract()).to.be.not.equal(null);
  });

  test('Check extract() method throws an exception when ', function() {
    chai.expect(config.extract()).to.be.not.equal(null);
  });

  test('Check generate() method returns valid value', function() {
    //chai.expect(config.generate()).to.be.not.equal(null);
  });
});