'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Instance as Property} from '../../lib/Property/Instance';
import {Instance} from '../../lib/Provisioning/Instance';
import {InvalidArgumentException} from '../../lib/Exception/InvalidArgumentException';

chai.use(sinonChai);

suite('Provisioning/Instance', function() {
  let provisioningInstance = null;
  let defaultConfig = {
    cloudfront: {},
    'cognito-identity': {},
    //dynamodb: {
    //  tablesNames: {},
    //},
    elasticache: {},
    iam: {},
    kinesis: {},
    s3: {},
    sns: {},
  };

  test('Class Instance exists in Provisioning/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });

  test('Check constructor throws InvalidArgumentException exception when passed parameter is not instanceof PropertyInstance', function() {
    let error = null;
    try {
      provisioningInstance = new Instance();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);

  });

  test('Check constructor creates successfully instance of Provisioning', function() {
    let error = null;
    let propertyInstance;

    try {
      propertyInstance = new Property('./test/testMaterials/Property2', 'deeploy.test.json');
      provisioningInstance = new Instance(propertyInstance);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.equal(null);
    chai.assert.instanceOf(propertyInstance, Property, 'propertyInstance is an instance of Property');
    chai.assert.instanceOf(provisioningInstance, Instance, 'provisioningInstance is an instance of Provisioning');
  });

  test('Check create() method throws "InvalidArgumentException" exception', function() {
    let error = null;

    try {
      provisioningInstance.create();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.not.equal(null);
    chai.assert.instanceOf(error, InvalidArgumentException, 'error is an instance of InvalidArgumentException');
  });

  test('Check postDeployProvision() method throws "InvalidArgumentException" exception', function() {
    let error = null;

    try {
      provisioningInstance.postDeployProvision();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.not.equal(null);
    chai.assert.instanceOf(error, InvalidArgumentException, 'error is an instance of InvalidArgumentException');
  });

  test('Check create() method call callback', function() {
    let error = null;
    let spyCallback = sinon.spy();

    try {
      provisioningInstance.create(spyCallback, true);
    } catch (e) {
      error = e;
    }

    //todo - TBD
    //chai.expect(error).to.be.equal(null);
  });

  test('Check cloudFront getter returns', function() {
    chai.expect(provisioningInstance.cloudFront).to.be.not.eql({});
    chai.expect(provisioningInstance.cloudFront.config.endpoint).to.be.contains('cloudfront');
  });

  test('Check cloudFront getter returns valid object', function() {
    chai.expect(provisioningInstance.cloudFront).to.be.not.eql({});
    chai.expect(provisioningInstance.cloudFront.config.endpoint).to.be.contains('cloudfront');
  });

  test('Check sns getter returns valid object', function() {
    chai.expect(provisioningInstance.sns).to.be.not.eql({});
    chai.expect(provisioningInstance.sns.config.endpoint).to.be.contains('sns');
  });

  test('Check kinesis getter returns valid object', function() {
    chai.expect(provisioningInstance.kinesis).to.be.not.eql({});
    chai.expect(provisioningInstance.kinesis.config.endpoint).to.be.contains('kinesis');
  });

  test('Check elasticCache getter returns valid object', function() {
    chai.expect(provisioningInstance.elasticCache).to.be.not.eql({});
    chai.expect(provisioningInstance.elasticCache.config.endpoint).to.be.contains('elasticache');
  });

  test('Check config getter returns valid object', function() {
    chai.expect(provisioningInstance.config).to.be.eql(defaultConfig);
  });

  test('Check config setter sets _config', function() {
    let config = provisioningInstance.config;
    let testConfig = {test: 'test'};

    provisioningInstance.config = testConfig;
    chai.expect(provisioningInstance.config).to.be.eql(testConfig);

    //undo test changes
    provisioningInstance.config = config;
    chai.expect(provisioningInstance.config).to.be.eql(config);
  });
});
