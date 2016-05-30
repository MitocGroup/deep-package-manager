'use strict';

import chai from 'chai';
import {Frontend} from '../../lib/Property/Frontend';
import path from 'path';

suite('Property/Frontend', () => {
  let basePath = './Property/';
  let basePathTrimmed = 'Property/';
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
    validationSchemas: [],

  };
  let configExpectedResult = {
    env: defaultConfig.env,
    deployId: defaultConfig.deployId,
    awsRegion: defaultConfig.awsRegion,
    models: defaultConfig.models,
    identityPoolId: '',
    identityProviders: '',
    microservices: {},
    globals: defaultConfig.globals,
    searchDomains: defaultConfig.searchDomains,
    validationSchemas: [],
  };

  test('Class Frontend exists in Property/Frontend', () => {
    chai.expect(Frontend).to.be.an('function');
  });

  test('Check constructor sets valid values', () => {
    chai.expect(frontend.basePath).to.be.equal(basePathTrimmed);
    chai.expect(frontend._microservicesConfig).to.be.eql(microservicesConfig);
  });

  test('Check path getter returns valid path', () => {
    chai.expect(frontend.path).to.be.equal(path.join(frontend.basePath, Frontend.PUBLIC_FOLDER));
  });

  test('Check modulePath() method returns valid path', () => {
    chai.expect(frontend.modulePath(moduleIdentifier)).to.be.equal(path.join(frontend.path, moduleIdentifier));
  });

  test('Check configPath getter returns valid path', () => {
    chai.expect(frontend.configPath).to.be.equal(path.join(frontend.path, Frontend.CONFIG_FILE));
  });

  //@todo - need to add if validationSchemas exists
  test('Check createConfig() method returns valid path', () => {
    chai.expect(Frontend.createConfig(defaultConfig)).to.be.eql(configExpectedResult);
  });
});
