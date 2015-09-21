'use strict';

import chai from 'chai';
import {PathTransformer} from '../../lib.compiled/Parameters/PathTransformer';

suite('Parameters/PathTransformer', function() {
  test('Class PathTransformer exists in Parameters/PathTransformer', function() {
    chai.expect(typeof PathTransformer).to.equal('function');
  });
});
