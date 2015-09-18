'use strict';

import chai from 'chai';
import {Config} from '../../lib.compiled/Property/Config';
import Core from '@mitocgroup/deep-core';

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
});