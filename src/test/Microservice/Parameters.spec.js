'use strict';

import chai from 'chai';
import {Parameters} from '../../lib/Microservice/Parameters';

suite('Microservice/Parameters', function() {
  let parameters = new Parameters();

  test('Class Parameters exists in Microservice/Parameters', function() {
    chai.expect(typeof Parameters).to.equal('function');
  });

  test('Check constructor sets valid default value for _rawParameters={}', function() {
    chai.expect(parameters.rawParameters).to.be.eql({});
  });

  test('Check constructor sets valid default value for _workingDir=null', function() {
    chai.expect(parameters._workingDir).to.be.equal(null);
  });

  test('Check constructor sets valid default value for _filledObject=null', function() {
    chai.expect(parameters._filledObject).to.be.equal(null);
  });

  test('Check constructor sets valid default value for _parsedObject', function() {
    chai.expect(parameters._parsedObject).to.be.eql({ error: null, value: {} });
  });

  test('Check rawParameters getter returns valid value', function() {
    chai.expect(parameters.rawParameters).to.be.eql({});
    parameters._rawParameters = { key: 'value'};
    chai.expect(parameters.rawParameters).to.be.eql({ key: 'value'});
  });

  test('Check valid getter returns true', function() {
    chai.expect(parameters.valid).to.be.equal(true);
  });

  test('Check error getter returns null', function() {
    chai.expect(parameters.error).to.be.equal(null);
  });

  test('Check GLOBALS static getter returns \'globals\'', function() {
    chai.expect(Parameters.GLOBALS).to.be.equal('globals');
  });

  test('Check FRONTEND static getter returns \'frontend\'', function() {
    chai.expect(Parameters.FRONTEND).to.be.equal('frontend');
  });

  test('Check BACKEND static getter returns \'backend\'', function() {
    chai.expect(Parameters.BACKEND).to.be.equal('backend');
  });
});
