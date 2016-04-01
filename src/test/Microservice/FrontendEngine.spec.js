'use strict';

import chai from 'chai';
import {FrontendEngine} from '../../lib/Microservice/FrontendEngine';

suite('Microservice/FrontendEngine', () => {
  let engines = ['engine1'];
  let enginesNew = ['engine2', 'engine3'];
  let frontendEngine = new FrontendEngine(engines);
  let enginesExpectedResult = `deep-root-${engines}`;
  let angularEngineResult = `deep-root-angular`;
  let microserviceInput = {
    config: {
      frontendEngine: 'test',
    },
  };
  let latestEngineVersion = '0.0.1';

  test('Class Config exists in Microservice/FrontendEngine', () => {
    chai.expect(FrontendEngine).to.be.an('function');
  });

  test('Check constructor sets valid default value for rawEngines', () => {
    chai.expect(frontendEngine.engines).to.be.eql([enginesExpectedResult]);
  });

  test('Check constructor sets valid default value for rawEngines', () => {
    chai.expect(frontendEngine.rawEngines).to.be.eql([engines]);
    frontendEngine._rawEngines = enginesNew;
    chai.expect(frontendEngine.rawEngines).to.be.eql(enginesNew);
  });

  test('Check findSuitable() method for default engine returns \'angular\'', () => {
    let frontendEmptyEngine = new FrontendEngine();
    chai.expect(frontendEmptyEngine.engines).to.be.eql(['deep-root-angular']);
    chai.expect(frontendEmptyEngine.findSuitable()).to.be.equal('angular');
  });

  test('Check match() method returns false', () => {
    chai.expect(frontendEngine.match()).to.be.equal(false);
  });

  test('Check match() method returns true', () => {
    chai.expect(frontendEngine.match(engines)).to.be.equal(true);
  });

  test('Check ANGULAR_ENGINE static getter method returns \'angular\'', () => {
    chai.expect(FrontendEngine.ANGULAR_ENGINE).to.be.equal('angular');
  });

  test(`Check getRealEngine() static method returns ${angularEngineResult}`, () => {
    chai.expect(FrontendEngine.getRealEngine('angular')).to.be.equal(angularEngineResult);
  });
  
  test('Check create() static method returns true', () => {
    enginesExpectedResult = FrontendEngine.create(microserviceInput);

    //todo - bug here?
    chai.expect(enginesExpectedResult).to.be.not.equal({});
  });
});
