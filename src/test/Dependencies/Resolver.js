'use strict';

import chai from 'chai';
import {Resolver} from '../../lib.compiled/Dependencies/Resolver';

suite('Dependencies/Resolver', function() {
  test('Class Resolver exists in Dependencies/Resolver', function() {
    chai.expect(typeof Resolver).to.equal('function');
  });
});