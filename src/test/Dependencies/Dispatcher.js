'use strict';

import chai from 'chai';
import {Dispatcher} from '../../lib.compiled/Dependencies/Dispatcher';

suite('Dependencies/Dispatcher', function() {
  test('Class Dispatcher exists in Dependencies/Dispatcher', function() {
    chai.expect(typeof Dispatcher).to.equal('function');
  });
});