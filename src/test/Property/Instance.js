'use strict';

import chai from 'chai';
import {Instance as PropertyInstance} from '../../lib.compiled/Property/Instance';
import {Exception} from '../../lib.compiled/Exception/Exception';
import {DuplicateRootException} from '../../lib.compiled/Property/Exception/DuplicateRootException';
import {MissingRootException} from '../../lib.compiled/Property/Exception/MissingRootException';
import {InvalidArgumentException} from '../../lib.compiled/Exception/InvalidArgumentException';

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
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');

    chai.expect(propertyInstance.path).to.be.equal('./test/testMaterials/Property2');
    chai.expect(propertyInstance._microservices).to.be.equal(null);
    chai.expect(propertyInstance.localDeploy).to.be.equal(false);
    chai.expect(propertyInstance.path).to.be.an.equal('./test/testMaterials/Property2');
  });

  test('Check concurrentAsyncCount static getter returns value more than 1', function() {
    chai.expect(PropertyInstance.concurrentAsyncCount).to.be.above(1);
  });

  test('Check fakeBuild() method', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property1', 'deeploy.test.json');
    let lambdas = propertyInstance.fakeBuild();

    chai.expect(lambdas).to.be.an('object');
  });

  test('Check fakeBuild() method with a complete microservice', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');

    let lambdas = propertyInstance.fakeBuild();

    chai.expect(lambdas).to.be.an('object');
  });

  test('Check fakeBuild() method throws DuplicateRootException when there are 2 root microservices', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property3', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.fakeBuild();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(DuplicateRootException);
  });

  test('Check fakeBuild() method throws MissingRootException when there are no root microservice', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property4', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.fakeBuild();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(MissingRootException);
  });

  test('Check build() method', function () {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property1', 'deeploy.test.json');

    chai.expect(propertyInstance.build(function() {})).to.be.an.instanceOf(PropertyInstance);
  });

  test('Check build() method throws DuplicateRootException when there are 2 root microservices', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property3', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.build(function() {});
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(DuplicateRootException);
  });

  test('Check build() method throws MissingRootException when there are no root microservices', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property4', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.build(function() {});
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(MissingRootException);
  });

  test('Check build() method throws InvalidArgumentException when callback is not a function', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property1', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.build({});
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
  });

  test('Check deploy() method to return a PropertyInstance', function() {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');

    propertyInstance.build(function() {
      propertyInstance.install(function() {
        chai.expect(propertyInstance.deploy(function() {})).to.be.an.instanceOf(PropertyInstance);
      });
    }, false);
  });

  test('Check deploy() method with skip provisioning to return a PropertyInstance', function() {
    //TODO: Improve this test
    let e = null;
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');

    propertyInstance.build(function() {
      try{
        propertyInstance.deploy(function() {})
      } catch(exception) {
        e = exception;
      }
      chai.expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
      chai.expect(e).to.be.an.instanceOf(TypeError);
    }, true);
  });

  test('Check install() method with correct property', function() {
    let e = null;
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');

    propertyInstance.install(function() {
      chai.expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
    });
  })
});