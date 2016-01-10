'use strict';

import chai from 'chai';
import {S3StdDriver} from '../../../lib/Dependencies/Driver/S3StdDriver';

suite('Dependencies/Driver/S3StdDriver', function() {
  //todo
  //let S3StdDriver = new S3StdDriver();

  test('Class S3StdDriver exists in Dependencies/Driver/S3StdDriver', function() {
    chai.expect(typeof S3StdDriver).to.equal('function');
  });
});
