'use strict';

import chai from 'chai';
import {Parameters} from '../../lib/Microservice/Parameters';

suite('Microservice/Parameters', () => {
  let parameters = new Parameters();

  test('Class Parameters exists in Microservice/Parameters', () => {
    chai.expect(typeof Parameters).to.equal('function');
  });

  test('Check constructor sets valid default value for _rawParameters={}', () => {
    chai.expect(parameters.rawParameters).to.be.eql({});
  });

  test('Check constructor sets valid default value for _workingDir=null', () => {
    chai.expect(parameters._workingDir).to.be.equal(null);
  });

  test('Check constructor sets valid default value for _filledObject=null', () => {
    chai.expect(parameters._filledObject).to.be.equal(null);
  });

  test('Check constructor sets valid default value for _parsedObject', () => {
    chai.expect(parameters._parsedObject).to.be.eql({ error: null, value: {} });
  });

  test('Check rawParameters getter returns valid value', () => {
    chai.expect(parameters.rawParameters).to.be.eql({});
    parameters._rawParameters = { key: 'value'};
    chai.expect(parameters.rawParameters).to.be.eql({ key: 'value'});
  });

  test('Check valid getter returns true', () => {
    chai.expect(parameters.valid).to.be.equal(true);
  });

  test('Check error getter returns null', () => {
    chai.expect(parameters.error).to.be.equal(null);
  });

  test('Check GLOBALS static getter returns \'globals\'', () => {
    chai.expect(Parameters.GLOBALS).to.be.equal('globals');
  });

  test('Check FRONTEND static getter returns \'frontend\'', () => {
    chai.expect(Parameters.FRONTEND).to.be.equal('frontend');
  });

  test('Check BACKEND static getter returns \'backend\'', () => {
    chai.expect(Parameters.BACKEND).to.be.equal('backend');
  });
});
