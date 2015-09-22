'use strict';

import chai from 'chai';
import {FrontendEngine} from '../../lib.compiled/Microservice/FrontendEngine';

suite('Microservice/FrontendEngine', function() {
  let engines = ['engine1'];
  let enginesNew = ['engine2', 'engine3'];
  let frontendEngine = new FrontendEngine(engines);
  let enginesExpectedResult = `deep.${engines}.root`;
  let angularEngineResult = `deep.ng.root`;
  let microserviceInput = {
    config: {
      frontendEngine: 'test',
    },
  };
  let latestEngineVersion = '0.0.1';

  test('Class Config exists in Microservice/FrontendEngine', function() {
    chai.expect(typeof FrontendEngine).to.equal('function');
  });

  test('Check constructor sets valid default value for rawEngines', function() {
    chai.expect(frontendEngine.engines).to.be.eql([enginesExpectedResult]);
  });

  test('Check constructor sets valid default value for rawEngines', function() {
    chai.expect(frontendEngine.rawEngines).to.be.eql([engines])
    frontendEngine._rawEngines = enginesNew;
    chai.expect(frontendEngine.rawEngines).to.be.eql(enginesNew);
  });

  test('Check findSuitable() method returns null', function() {
    chai.expect(frontendEngine.findSuitable()).to.be.equal(null);
  });

  test('Check match() method returns false', function() {
    chai.expect(frontendEngine.match()).to.be.equal(false);
  });

  test('Check match() method returns true', function() {
    chai.expect(frontendEngine.match(engines)).to.be.equal(true);
  });

  test('Check ANGULAR_ENGINE static getter method returns \'angular\'', function() {
    chai.expect(FrontendEngine.ANGULAR_ENGINE).to.be.equal('angular');
  });

  test('Check getRealEngine() static method returns true', function() {
    chai.expect(FrontendEngine.getRealEngine('angular')).to.be.equal(angularEngineResult);
  });

  test('Check getRealEngine() static method returns true', function() {
    chai.expect(FrontendEngine.getLatestEngineVersion()).to.be.equal(latestEngineVersion );
  });

  test('Check create() static method returns true', function() {
    enginesExpectedResult = FrontendEngine.create(microserviceInput)
    //todo - bug here?
    chai.expect(enginesExpectedResult).to.be.not.equal({});
  });
});
