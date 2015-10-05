'use strict';

import chai from 'chai';
import {Model} from '../../lib.compiled/Property/Model';

suite('Property/Model', function() {
  let modelName = 'name';
  let modelDefenition = 'definition';
  let modelInstance = new Model();

  test('Class Model exists in Property/Model', function() {
    chai.expect(typeof Model).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(modelInstance.name).to.be.equal(undefined);
    chai.expect(modelInstance.definition).to.be.equal(undefined);
  });

  test('Check constructor sets valid values', function() {
    modelInstance = new Model(modelName, modelDefenition);
    chai.expect(modelInstance.name).to.be.equal(modelName);
    chai.expect(modelInstance.definition).to.be.equal(modelDefenition);
  });

  test('Check EXTENSION static getter returns \'json\'', function() {
    chai.expect(Model.EXTENSION).to.be.equal('json');
  });

  test('Check extract() method returns valid object with _defenition field', function() {
    let expectedResult = {};
    expectedResult[modelInstance.name] = modelInstance.definition;
    chai.expect(modelInstance.extract()).to.be.eql(expectedResult);
  });

  test('Check create() static method creates empty model', function() {
    chai.expect(Model.create()).to.be.eql([]);
  });

  test('Check create() static method creates valid models', function() {
    let models = Model.create('./test/Property/goodModel');
    chai.expect(models).to.be.an('array');
    chai.expect(models.pop()).to.be.an.instanceof(Model);
  });

  test('Check create() static method throws SyntaxError on invalid model', function () {
    let exception = null;
    try {
      let models = Model.create('./test/Property/badModel');
    } catch(e) {
      exception = e;
    }

    chai.expect(exception).to.be.an.instanceof(SyntaxError);
  });
});
