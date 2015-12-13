'use strict';

import chai from 'chai';
import {SharedAwsConfig} from '../../lib/Helpers/SharedAwsConfig';

suite('Helpers/SharedAwsConfig', function() {
  test('Class SharedAwsConfig exists in Helpers/SharedAwsConfig', function() {
    chai.expect(typeof SharedAwsConfig).to.equal('function');
  });
});
