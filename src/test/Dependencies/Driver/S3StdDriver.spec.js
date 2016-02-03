'use strict';

import chai from 'chai';
import {S3StdDriver} from '../../../lib/Dependencies/Driver/S3StdDriver';

suite('Dependencies/Driver/S3StdDriver', () => {
  //todo
  //let S3StdDriver = new S3StdDriver();

  test('Class S3StdDriver exists in Dependencies/Driver/S3StdDriver', () => {
    chai.expect(S3StdDriver).to.be.an('function');
  });
});
