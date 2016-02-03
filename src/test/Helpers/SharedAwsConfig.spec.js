'use strict';

import chai from 'chai';
import {SharedAwsConfig} from '../../lib/Helpers/SharedAwsConfig';

suite('Helpers/SharedAwsConfig', () => {
  let provider = {
    accessKeyId: 'test_accessKeyId123',
    secretAccessKey: 'test_secretAccessKey123',
    region: 'us-west-2',
    refresh: () => {
      return this;
    }
  };

  let credentials = {
    accessKeyId: 'test_accessKeyId123',
    secretAccessKey: 'test_secretAccessKey123',
    region: 'us-west-2',
  };

  let sharedAwsConfig = new SharedAwsConfig();

  test('Class SharedAwsConfig exists in Helpers/SharedAwsConfig', () => {
    chai.expect(typeof SharedAwsConfig).to.equal('function');
  });

  test('Check constructor sets valid default value for _credentials', () => {
    chai.expect(sharedAwsConfig._credentials).to.be.equal(null);
  });

  test('Check constructor sets valid default value for _providers', () => {
    chai.expect(sharedAwsConfig.providers.length).to.equal(4);
  });

  test('Check DEFAULT_REGION returns "us-west-2"', () => {
    chai.expect(SharedAwsConfig.DEFAULT_REGION).to.equal('us-west-2');
  });

  test('Check AWS_GLOB_CFG_FILE returns path to global config', () => {
    chai.expect(SharedAwsConfig.AWS_GLOB_CFG_FILE).to.include('/credentials');
  });

  test('Check _getWeight returns valid value', () => {
    chai.expect(sharedAwsConfig._getWeight(provider)).to.be.equal(5);
  });

  test('Check _chooseCredentials() returns valid credentials', () => {
    chai.expect(sharedAwsConfig._chooseCredentials([provider])).to.be.eql(credentials);
  });

  test('Check _chooseCredentials() without args returns null credentials', () => {
    let credentials = {
      accessKeyId: null,
      secretAccessKey: null,
      region: null,
    };

    chai.expect(sharedAwsConfig._chooseCredentials()).to.be.eql(credentials);
  });

  test('Check addProvider() adds new provider', () => {
    sharedAwsConfig.addProvider(provider);

    chai.expect(sharedAwsConfig.providers.length).to.be.equal(5);
    chai.expect(sharedAwsConfig.providers).to.contains(provider);
  });

  test('Check guess() returns valid credentials for _credentials', () => {
    let credentials = {
      accessKeyId: null,
      secretAccessKey: null,
      region: null,
    };

    chai.expect(sharedAwsConfig.guess()).to.be.eql(credentials);
  });

  test('Check guess() returns valid credentials for !_credentials', () => {
    sharedAwsConfig._credentials = null;

    chai.expect(sharedAwsConfig.guess()).to.be.eql(credentials);
  });
});
