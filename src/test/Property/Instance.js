'use strict';

import chai from 'chai';
import {Instance} from '../../lib.compiled/Property/Instance';

suite('Property/Instance', function() {
  //let propertyInstance = new Instance();

  test('Class Instance exists in Property/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });
});