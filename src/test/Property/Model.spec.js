'use strict';

import chai from 'chai';
//import {Model} from '../../lib/Property/Model';
//
//suite('Property/Model', () => {
//  let modelName = 'name';
//  let modelDefinition = 'definition';
//  let modelInstance = new Model();
//
//  test('Class Model exists in Property/Model', () => {
//    chai.expect(Model).to.be.an('function');
//  });
//
//  test('Check constructor sets valid default values', () => {
//    chai.expect(modelInstance.name).to.be.equal(undefined);
//    chai.expect(modelInstance.definition).to.be.equal(undefined);
//  });
//
//  test('Check constructor sets valid values', () => {
//    modelInstance = new Model(modelName, modelDefinition);
//    chai.expect(modelInstance.name).to.be.equal(modelName);
//    chai.expect(modelInstance.definition).to.be.equal(modelDefinition);
//  });
//
//  test('Check EXTENSION static getter returns \'json\'', () => {
//    chai.expect(Model.EXTENSION).to.be.equal('json');
//  });
//
//  test('Check extract() method returns valid object with _defenition field', () => {
//    let expectedResult = {};
//    expectedResult[modelInstance.name] = modelInstance.definition;
//    chai.expect(modelInstance.extract()).to.be.eql(expectedResult);
//  });
//
//  test('Check create() static method creates empty model', () => {
//    chai.expect(Model.create()).to.be.eql([]);
//  });
//
//  test('Check create() static method creates valid models', () => {
//    let models = Model.create('./test/Property/goodModel');
//    chai.expect(models).to.be.an('array');
//    chai.expect(models.pop()).to.be.an.instanceof(Model);
//  });
//
//  test('Check create() static method throws SyntaxError on invalid model', () => {
//    let exception = null;
//    try {
//      Model.create('./test/Property/badModel');
//    } catch (e) {
//      exception = e;
//    }
//
//    chai.expect(exception).to.be.an.instanceof(SyntaxError);
//  });
//});
