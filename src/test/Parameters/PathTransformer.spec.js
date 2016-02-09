'use strict';

import chai from 'chai';
import {PathTransformer} from '../../lib/Parameters/PathTransformer';

suite('Parameters/PathTransformer', () => {

  let pathTransformer = new PathTransformer();
  let keyVector = ['one', 'two', 'three'];
  let keyObject = {
    one: {
      key1: 'value1', },
    two: {
      key2: 'value2', },
    three: {
      key3: 'value3', },
  };
  let testValue = 'testValue';
  let expectedResult = {
    one: {
      two: {
        three: 'testValue',
      },
    },
  };
  let planifyExpectedResult = {
    'one|key1': 'value1',
    'two|key2': 'value2',
    'three|key3': 'value3',
  };

  test('Class PathTransformer exists in Parameters/PathTransformer', () => {
    chai.expect(PathTransformer).to.be.an('function');
  });

  test('Check _embedObject static method returns valid object', () => {
    chai.expect(PathTransformer._embedObject(keyVector, testValue)).to.be.eql(expectedResult);
  });

  test('Check transform  method returns valid object', () => {
    chai.expect(pathTransformer.transform(keyObject)).to.be.eql(keyObject);
  });

  test('Check transform  method returns valid object', () => {
    chai.expect(pathTransformer.plainify(keyObject)).to.be.eql(planifyExpectedResult);
  });

  test('Check DEFAULT_DELIMITER static getter returns \'|\'', () => {
    chai.expect(PathTransformer.DEFAULT_DELIMITER).to.be.eql('|');
  });
});
