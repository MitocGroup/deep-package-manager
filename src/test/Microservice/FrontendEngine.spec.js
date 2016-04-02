'use strict';

import chai from 'chai';
import {FrontendEngine} from '../../lib/Microservice/FrontendEngine';

suite('Microservice/FrontendEngine', () => {
  let engines = ['engine1'];
  let enginesNew = ['engine2', 'engine3'];
  let frontendEngine = new FrontendEngine(engines);
  let angularEngineResult = `deep-root-angular`;
  let aureliaEngineResult = `deep-root-aurelia`;
  let reactEngineResult = `deep-root-react`;
  let vanillaEngineResult = `deep-root-vanilla`;
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
    chai.expect(frontendEngine.engines).to.be.eql([vanillaEngineResult]);
  });

  test('Check constructor sets valid default value for rawEngines', () => {
    chai.expect(frontendEngine.rawEngines).to.be.eql([engines]);
    frontendEngine._rawEngines = enginesNew;
    chai.expect(frontendEngine.rawEngines).to.be.eql(enginesNew);
  });

  test('Check findSuitable() method for default engine returns \'angular\'', () => {
    let frontendEmptyEngine = new FrontendEngine();
    chai.expect(frontendEmptyEngine.engines).to.be.eql([angularEngineResult, vanillaEngineResult]);
    chai.expect(frontendEmptyEngine.findSuitable()).to.be.equal('angular');
  });

  //test('Check match() method returns false', () => {
  //  chai.expect(frontendEngine.match()).to.be.equal(false);
  //});

  test('Check match() method returns true', () => {
    chai.expect(frontendEngine.match(engines)).to.be.equal(true);
  });

  test('Check ANGULAR_ENGINE static getter method returns \'angular\'', () => {
    chai.expect(FrontendEngine.ANGULAR_ENGINE).to.be.equal('angular');
  });

  test(`Check getRealEngine() static method returns ${angularEngineResult}`, () => {
    chai.expect(FrontendEngine.getRealEngine('angular')).to.be.equal(angularEngineResult);
  });
  
    test('Check AURELIA_ENGINE static getter method returns \'aurelia\'', () => {
    chai.expect(FrontendEngine.AURELIA_ENGINE).to.be.equal('aurelia');
  });

  test(`Check getRealEngine() static method returns ${aureliaEngineResult}`, () => {
    chai.expect(FrontendEngine.getRealEngine('aurelia')).to.be.equal(aureliaEngineResult);
  });
  
  test('Check REACT_ENGINE static getter method returns \'react\'', () => {
    chai.expect(FrontendEngine.REACT_ENGINE).to.be.equal('react');
  });

  test(`Check getRealEngine() static method returns ${reactEngineResult}`, () => {
    chai.expect(FrontendEngine.getRealEngine('react')).to.be.equal(reactEngineResult);
  });
  
  test('Check VANILLA_ENGINE static getter method returns \'vanilla\'', () => {
    chai.expect(FrontendEngine.VANILLA_ENGINE).to.be.equal('vanilla');
  });

  test(`Check getRealEngine() static method returns ${vanillaEngineResult}`, () => {
    chai.expect(FrontendEngine.getRealEngine('vanilla')).to.be.equal(vanillaEngineResult);
  });
  
  test('Check create() static method returns true', () => {
    //todo - bug here?
    chai.expect(FrontendEngine.create(microserviceInput)).to.be.not.equal({});
  });
});
