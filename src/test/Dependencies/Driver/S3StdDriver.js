'use strict';

import chai from 'chai';
import {S3StdDriver} from '../../../lib.compiled/Dependencies/Driver/S3StdDriver';

suite('Dependencies/Driver/S3StdDriver', function() {
  test('Class S3StdDriver exists in Dependencies/Driver/S3StdDriver', function() {
    chai.expect(typeof S3StdDriver).to.equal('function');
  });
});
