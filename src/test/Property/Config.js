'use strict';

import chai from 'chai';
import {Config} from '../../lib.compiled/Property/Config';

suite('Property/Config', function() {
  let config = new Config();
  let configName = './test/Property/deeploy.test.json';

  test('Class Config exists in Property/Config', function() {
    chai.expect(typeof Config).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(config._rawConfig).to.be.eql({});
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
      aws: {
        accessKeyId: null,
        region: null,
        secretAccessKey: null,
      },
      dependencies: {
        bucket: 'testbucket',
      },
      env: 'test',
      awsAccountId: 123456789012,
      appIdentifier: 'generated',
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
    let generatedConfig = {
      aws: {
        accessKeyId: null,
        region: null,
        secretAccessKey: null,
      },
      awsAccountId: 123456789012,
      env: 'dev',
      appIdentifier: 'randomly generated',
    };
    chai.expect(Config.generate().aws.accessKeyId).to.be.equal(generatedConfig.aws.accessKeyId);
    chai.expect(Config.generate().aws.region).to.be.equal(generatedConfig.aws.region);
    chai.expect(Config.generate().aws.secretAccessKey).to.be.equal(generatedConfig.aws.secretAccessKey);
    chai.expect(Config.generate().awsAccountId).to.be.equal(generatedConfig.awsAccountId);
    chai.expect(Config.generate().env).to.be.equal(generatedConfig.env);
    chai.expect(Config.generate().aws.appIdentifier).to.be.not.equal('');
  });
});