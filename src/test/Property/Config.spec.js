'use strict';

import chai from 'chai';
import {Config} from '../../lib/Property/Config';

suite('Property/Config', () => {
  let rawConfig = {
    aws: {
      accessKeyId: 'to_pass_string_validation',
      region: 'us-west-2',
      secretAccessKey: 'to_pass_string_validation',
    },
    env: 'test',
    awsAccountId: 123456789012,
    appIdentifier: 'test_appId-432423-generated',
  };
  let config = new Config(rawConfig);
  let configName = './test/testMaterials/Property1/deeploy.test.json';

  test('Class Config exists in Property/Config', () => {
    chai.expect(Config).to.be.an('function');
  });

  test('Check constructor sets  _rawConfig', () => {
    chai.expect(config._rawConfig).to.be.eql(rawConfig);
  });

  test('Check rawConfig  getter returns valid value', () => {
    chai.expect(config.rawConfig).to.be.eql(rawConfig);
  });

  test('Check valid  getter returns true', () => {
    chai.expect(config.valid).to.be.equal(true);
  });

  test('Check error getter returns null', () => {
    chai.expect(config.error).to.be.equal(null);
  });

  test('Check DEFAULT_FILENAME static getter returns \'deeploy.json\'', () => {
    chai.expect(Config.DEFAULT_FILENAME).to.be.equal('deeploy.json');
  });

  test('Check createFromJsonFile() static method returns valid istance of Config class', () => {
    let extpectedResult = {
      aws: {
        accessKeyId: 'to_pass_string_validation',
        region: 'us-west-2',
        secretAccessKey: 'to_pass_string_validation',
      },
      env: 'test',
      awsAccountId: 123456789012,
      appIdentifier: 'generated',
    };

    chai.expect(Config.createFromJsonFile(configName).rawConfig).to.be.eql(extpectedResult);
  });

  test('Check extract() method returns valid value', () => {
    chai.expect(config.extract()).to.be.not.equal(null);
  });

  test('Check extract() method throws an exception when ', () => {
    chai.expect(config.extract()).to.be.not.equal(null);
  });

  //@todo - commented becuase need to be discussed with AlexanderC
  //test('Check generate() method returns valid value', () => {
  //  let generatedConfig = {
  //    aws: {
  //      accessKeyId: null,
  //      region: 'us-west-2',
  //      secretAccessKey: null,
  //    },
  //    awsAccountId: 123456789012,
  //    env: 'dev',
  //    appIdentifier: 'randomly generated',
  //  };
  //  chai.expect(Config.generate().awsAccountId).to.be.equal(generatedConfig.awsAccountId);
  //  chai.expect(Config.generate().env).to.be.equal(generatedConfig.env);
  //});
});
