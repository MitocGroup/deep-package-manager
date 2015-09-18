'use strict';

import chai from 'chai';
import {Model} from '../../lib.compiled/Property/Model';

suite('Property/Model', function() {
  let modelName = 'name';
  let modelDefenition = 'definition';
  let model = new Model();

  test('Class Model exists in Property/Model', function() {
    chai.expect(typeof Model).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(model.name).to.be.equal(undefined);
    chai.expect(model.definition).to.be.equal(undefined);
  });

  test('Check constructor sets valid values', function() {
    model = new Model(modelName, modelDefenition);
    chai.expect(model.name).to.be.equal(modelName);
    chai.expect(model.definition).to.be.equal(modelDefenition);
  });

  test('Check EXTENSION static getter returns \'json\'', function() {
    chai.expect(Model.EXTENSION).to.be.equal('json');
  });

  test('Check extract() method returns valid object with _defenition field', function() {
    let expectedResult = {};
    expectedResult[model.name] = model.definition;
    chai.expect(model.extract()).to.be.eql(expectedResult);
  });

  test('Check create() static method creates valid models', function() {
    chai.expect(Model.create()).to.be.eql([]);
  });
});
