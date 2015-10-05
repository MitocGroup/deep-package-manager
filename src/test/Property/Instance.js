'use strict';

import chai from 'chai';
import {Instance as PropertyInstance} from '../../lib.compiled/Property/Instance';
import {Exception} from '../../lib.compiled/Exception/Exception';

suite('Property/Instance', function() {

  test('Class Instance exists in Property/Instance', function() {
    chai.expect(typeof PropertyInstance).to.equal('function');
  });

  test('Check constructor throws Exception if config file doesn\'t exist', function() {
    let error = null;
    let configPath = 'invalidPath';
    let configName = 'invalidConfig.json';
    try {
      new PropertyInstance(configPath, configName);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(Exception);
    chai.expect(error.message).to.be.equal(`Missing ${configName} configuration file from ${configPath}.`);
  });

  test('Check constructor sets valid default values', function() {
    let configPath = './test/testMaterials/Property';
    let configName = 'deeploy.test.json';

    let propertyInstance = new PropertyInstance(configPath, configName);

    chai.expect(propertyInstance.path).to.be.equal(configPath);
    chai.expect(propertyInstance._microservices).to.be.equal(null);
    chai.expect(propertyInstance.localDeploy).to.be.equal(false);
    chai.expect(propertyInstance.path).to.be.an.equal(configPath);
  });

  test('Check concurrentAsyncCount static getter returns value more than 1', function() {
    chai.expect(PropertyInstance.concurrentAsyncCount).to.be.above(1);
  });

  test('Check fakeBuild() method', function() {
    let configPath = './test/testMaterials/Property';
    let configName = 'deeploy.test.json';

    let propertyInstance = new PropertyInstance(configPath, configName);

    let lambdas = propertyInstance.fakeBuild();

    chai.expect(lambdas).to.be.an('object');
  });

  test('Check build() method', function () {
    let configPath = './test/testMaterials/Property';
    let configName = 'deeploy.test.json';

    let propertyInstance = new PropertyInstance(configPath, configName);

    let property = propertyInstance.build(function() {});

    chai.expect(property).to.be.an.instanceOf(PropertyInstance);
  });

  test('Check deploy() method', function() {
    let configPath = './test/testMaterials/Property';
    let configName = 'deeploy.test.json';

    let propertyInstance = new PropertyInstance(configPath, configName);

    //let property = propertyInstance.deploy(function() {});
    //
    //chai.expect(property).to.be.an.instanceOf(PropertyInstance);
  })
});