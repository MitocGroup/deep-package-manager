'use strict';

import chai from 'chai';
import {Instance} from '../../lib.compiled/Microservice/Instance';
import {FrontendEngine} from '../../lib.compiled/Microservice/FrontendEngine';
import {InvalidArgumentException} from '../../lib.compiled/Exception/InvalidArgumentException';
import {Parameters} from '../../lib.compiled/Microservice/Parameters';
import {Config} from '../../lib.compiled/Microservice/Config';

suite('Microservice/Instance', function() {
  let configInput = {
    name: 'config',
    propertyRoot: false,
    description: 'Config unit test',
    identifier: 'unit_test',
    version: '0.0.1',
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
  let basePath = 'basePath';
  let instance = new Instance(config, parameters, basePath);

  test('Class Instance exists in Microservice/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });

  test('Contructor throws TypeError when called as a function', function() {
    let e = null;
    try {
      Instance(config, parameters, basePath);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(TypeError);
  });

  test('Constructor throws InvalidArgumentException when config is not instance of config', function() {
    let e = null;
    try {
      new Instance({}, parameters, basePath);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(instance._resources).to.be.equal(null);
  });

  test('Constructor throws InvalidArgumentException when parameters is not instance of parameters', function() {
    let e = null;
    try {
      new Instance(config, {}, basePath);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
  });

  test('Check CONFIG_FILE static getter returns \'deepkg.json\'', function() {
    chai.expect(Instance.CONFIG_FILE).to.be.equal('deepkg.json');
  });

  test('Check PARAMS_FILE static getter returns \'parameters.json\'', function() {
    chai.expect(Instance.PARAMS_FILE).to.be.equal('parameters.json');
  });

  test('Check RESOURCES_FILE static getter returns \'resources.json\'', function() {
    chai.expect(Instance.RESOURCES_FILE).to.be.equal('resources.json');
  });

  test('Check identifier getter returns valid value', function() {
    chai.expect(instance.identifier).to.be.equal(configInput.identifier);
  });

  test('Check version getter returns valid value', function() {
    chai.expect(instance.version).to.be.equal(configInput.version);
  });

  test('Check basePath getter returns valid value', function() {
    chai.expect(instance.basePath).to.be.equal(basePath);
  });

  test('Check isRoot getter returns false', function() {
    chai.expect(instance.isRoot).to.be.equal(configInput.propertyRoot);
  });

  test('Check config getter returns valid config object', function() {
    chai.expect(instance.config).to.be.equal(instance._config);
  });

  test('Check parameters getter returns valid parameters object', function() {
    chai.expect(instance.parameters).to.be.equal(instance._parameters);
  });

  test('Check autoload getter returns valid parameters object', function() {
    chai.expect(instance.autoload).to.be.equal(instance._autoload);
  });

  test('Check resources getter returns valid parameters object', function() {
    chai.expect(instance.resources).to.be.equal(instance._resources);
  });

  test('Check frontendEngine getter returns an instance of frontendEngine', function() {
    chai.expect(instance.frontendEngine).to.be.an.instanceOf(FrontendEngine);
  });

  test('Check postDeployHook getter returns null when no hook exists', function() {
    chai.expect(instance.postDeployHook).to.be.equal(null);
  });
});
