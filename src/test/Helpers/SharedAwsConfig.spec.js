'use strict';

import chai from 'chai';
import {SharedAwsConfig} from '../../lib/Helpers/SharedAwsConfig';

suite('Helpers/SharedAwsConfig', function() {
  let sharedAwsConfig = new SharedAwsConfig();

  test('Class SharedAwsConfig exists in Helpers/SharedAwsConfig', function() {
    chai.expect(typeof SharedAwsConfig).to.equal('function');
  });

  test('Check constructor sets valid default value for _credentials', function() {
    chai.expect(sharedAwsConfig._credentials).to.be.equal(null);
  });

  test('Check constructor sets valid default value for _providers', function() {
    chai.expect(sharedAwsConfig.providers.length).to.equal(4);
  });

  test('Check DEFAULT_REGION returns "us-west-2"', function() {
    chai.expect(SharedAwsConfig.DEFAULT_REGION).to.equal('us-west-2');
  });
});
