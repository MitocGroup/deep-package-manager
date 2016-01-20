'use strict';

import chai from 'chai';
import {Frontend} from '../../lib/Property/Frontend';

suite('Property/Frontend', function() {
  let basePath = './Property/';
  let basePathTrimmed = './Property';
  let microservicesConfig = {};
  let moduleIdentifier = 'identifierTest';
  let propertyInstance = {
    path: 'propertyPath',
    identifier: 'appIdentifier',
    config: {
      awsAccountId: 123456789012,
    },
    provisioning: {
      s3: {
        config: {
          region: 'us-west-2',
        },
      },
    },
  };

  let frontend = new Frontend(propertyInstance, microservicesConfig, basePath);

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
      appIdentifier: '59e6913c9ed3afe744b5434817ce6345',
    },
  };
  let configExpectedResult = {
    env: defaultConfig.env,
    deployId: defaultConfig.deployId,
    awsRegion: defaultConfig.awsRegion,
    models: defaultConfig.models,
    search: {},
    identityPoolId: '',
    identityProviders: '',
    microservices: {},
    globals: defaultConfig.globals,
  };

  test('Class Frontend exists in Property/Frontend', function() {
    chai.expect(typeof Frontend).to.equal('function');
  });

  test('Check constructor sets valid values', function() {
    chai.expect(frontend.basePath).to.be.equal(basePathTrimmed);
    chai.expect(frontend._microservicesConfig).to.be.eql(microservicesConfig);
  });

  test('Check path getter returns valid path', function() {
    chai.expect(frontend.path).to.be.equal(`${frontend.basePath}/_public`);
  });

  test('Check modulePath() method returns valid path', function() {
    chai.expect(frontend.modulePath(moduleIdentifier)).to.be.equal(`${frontend.path}/${moduleIdentifier}`);
  });

  test('Check configPath getter returns valid path', function() {
    chai.expect(frontend.configPath).to.be.equal(`${frontend.path}/_config.json`);
  });

  test('Check createConfig() method returns valid path', function() {
    chai.expect(Frontend.createConfig(defaultConfig)).to.be.eql(configExpectedResult);
  });
});
