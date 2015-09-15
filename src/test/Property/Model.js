'use strict';

import chai from 'chai';
import {Model} from '../../lib.compiled/Property/Model';

suite('Property/Model', function() {
  let model = new Model();

  test('Class Model exists in Property/Model', function() {
    chai.expect(typeof Model).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(model._name).to.be.equal(undefined);
    chai.expect(model._definition).to.be.equal(undefined);
  });

  test('Check name getter returns undefined', function() {
    chai.expect(model.name).to.be.equal(undefined);
  });

  test('Check name getter returns undefined', function() {
    chai.expect(model.definition).to.be.equal(undefined);
  });

  test('Check EXTENSION static getter returns \'json\'', function() {
    chai.expect(Model.EXTENSION).to.be.equal('json');
  });
});
