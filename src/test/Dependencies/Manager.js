'use strict';

import chai from 'chai';
import {Manager} from '../../lib.compiled/Dependencies/Manager';

suite('Dependencies/Manager', function() {
  test('Class Manager exists in Dependencies/Manager', function() {
    chai.expect(typeof Manager).to.equal('function');
  });
});