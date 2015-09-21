'use strict';

import chai from 'chai';
import {Schema} from '../../lib.compiled/Parameters/Schema';

suite('Parameters/Schema', function() {
  test('Class Schema exists in Parameters/Schema', function() {
    chai.expect(typeof Schema).to.equal('function');
  });
});
