'use strict';

import chai from 'chai';
import {Schema} from '../../lib/Parameters/Schema';
import {InvalidValuesException} from '../../lib/Parameters/Exception/InvalidValuesException';

suite('Parameters/Schema', () => {
  let ramlModel = {
    username: {
      type: 'string',
      minLength: 5,
      maxLength: 50,
    },
  };
  let testPositiveObject = {
    username: 'TestUser',
  };
  let validResult = {
    errors: [],
    valid: true,
  };
  let testNegativeObject = {
    username: 'User',
  };
  let invalidResult = {
    errors: [
      {
        attr: 5,
        key: 'username',
        rule: 'minLength',
        valid: false,
        value: 'User',
      },
    ],
    valid: false,
  };

  let schema = new Schema(ramlModel);

  test('Class Schema exists in Parameters/Schema', () => {
    chai.expect(typeof Schema).to.equal('function');
  });

  test('Check constructor sets valid default value for ramlModel', () => {
    chai.expect(schema.ramlModel).to.be.equal(ramlModel);
  });

  test('Check validator getter returns RamlValidator function', () => {
    chai.expect(typeof schema.validator).to.equal('function');
  });

  test('Check sanitizer getter returns RamlSanitizer function', () => {
    chai.expect(typeof schema.sanitizer).to.equal('function');
  });

  test('Check validate() method returns object w/o errors', () => {
    chai.expect(schema.validate(testPositiveObject)).to.be.eql(validResult);
  });

  test('Check validate() method returns object with errors', () => {
    chai.expect(schema.validate(testNegativeObject)).to.be.eql(invalidResult);
  });

  test('Check constructor sets valid default values', () => {
    let error = null;
    try {
      schema.extract(testNegativeObject);
    } catch (e) {
      error = e;
      chai.expect(error).to.be.an.instanceOf(InvalidValuesException);
      //chai.expect(error.message).to.be.an.contains(`Invalid value`);
      chai.expect(error.rawErrors).to.be.an.eql(invalidResult.errors);
    }
  });

  //todo - TBD
  test('Check extractInteractive() method returns {}', () => {
    //chai.expect(schema.extractInteractive()).to.be.eql({});
  });
});
