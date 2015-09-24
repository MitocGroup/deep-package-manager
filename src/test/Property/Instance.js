'use strict';

import chai from 'chai';
import {Instance} from '../../lib.compiled/Property/Instance';
import {Exception} from '../../lib.compiled/Exception/Exception';

suite('Property/Instance', function() {
  let propertyInstance = null;
  let configPath = 'test/Property';
  let configName = 'deeploy.test.json';
  let error = null;

  test('Class Instance exists in Property/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });

  test('Check constructor throws Exception if config file doesn\'t exist', function() {
    error = null;
    let invalidConfigPath = 'invalidPath';
    let invalidConfigName = 'invalidConfig.json';
    try {
      propertyInstance = new Instance(invalidConfigPath, invalidConfigName);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(Exception);
    chai.expect(error.message).to.be.an.equal(`Missing ${invalidConfigName} configuration file from ${invalidConfigPath}.`);
  });

  test('Check constructor sets valid default values', function() {
    error = null;
    try {
      propertyInstance = new Instance(configPath, configName);
    } catch (e) {
      error = e;
      //chai.expect(e.message).to.be.an.equal('fhfghgfhgf');
    }

   // chai.expect(propertyInstance.path).to.be.an.equal(configPath);
    //chai.expect(propertyInstance._microservices).to.be.an.equal(null);
    //chai.expect(propertyInstance.localDeploy).to.be.an.equal(false);
    //chai.expect(propertyInstance.path).to.be.an.equal(configPath);
  });

  test('Check concurrentAsyncCount static getter returns value more than 1', function() {
    chai.expect(Instance.concurrentAsyncCount).to.be.above(1);
  });
});