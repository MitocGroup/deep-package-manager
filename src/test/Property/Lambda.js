'use strict';

import chai from 'chai';
import {Lambda} from '../../lib.compiled/Property/Lambda';

suite('Property/Lambda', function() {
  //let lambda = new Lambda();

  test('Class Lambda exists in Property/Lambda', function() {
    chai.expect(typeof Lambda).to.equal('function');
  });
});