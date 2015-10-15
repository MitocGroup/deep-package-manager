'use strict';

import chai from 'chai';
import {Action} from '../../../lib.compiled/Microservice/Metadata/Action';

suite('Microservice/Metadata/Action', function() {
  let configInput = {
    cacheTtl: 60,
    hasToCache: true,
    identifier: 'test identifier',
    resourceName: 'testResourceName',
    name: 'testActionName',
    description: 'Lambda for retrieve counts',
    type: 'lambda',
    source: 'src/Property/RetrieveCounts',
    engine: {
      memory: 120,
      timeout: 60,
      runtime: 'nodejs',
    },
    methods: ['GET', 'POST'],
  };

  let action = new Action(configInput.resourceName, configInput.name, configInput);

  test('Class Action exists in Microservice/Metadata/Action', function() {
    chai.expect(typeof Action).to.equal('function');
  });

  test('Check HTTP_VERBS static getter returns \'external\'', function() {
    chai.expect(Action.HTTP_VERBS.length).to.be.equal(7);
    chai.expect(Action.HTTP_VERBS).to.be.include('GET');
    chai.expect(Action.HTTP_VERBS).to.be.include('POST');
    chai.expect(Action.HTTP_VERBS).to.be.include('DELETE');
    chai.expect(Action.HTTP_VERBS).to.be.include('HEAD');
    chai.expect(Action.HTTP_VERBS).to.be.include('PUT');
    chai.expect(Action.HTTP_VERBS).to.be.include('OPTIONS');
    chai.expect(Action.HTTP_VERBS).to.be.include('PATCH');
  });

  test('Check LAMBDA static getter returns \'lambda\'', function() {
    chai.expect(Action.LAMBDA).to.be.equal('lambda');
  });

  test('Check EXTERNAL static getter returns \'external\'', function() {
    chai.expect(Action.EXTERNAL).to.be.equal('external');
  });

  test('Check resourceName getter returns valid resourceName', function() {
    chai.expect(action.resourceName).to.equal(configInput.resourceName);
  });

  test('Check name getter returns valid  action name', function() {
    chai.expect(action.name).to.equal(configInput.name);
  });

  test('Check identifier getter returns valid  identifier', function() {
    configInput.identifier = action.identifier;
    chai.expect(action.identifier).to.equal(`${configInput.resourceName}-${configInput.name}`);
  });

  test('Check description getter returns valid  action description', function() {
    chai.expect(action.description).to.equal(configInput.description);
  });

  test('Check type getter returns valid  action type', function() {
    chai.expect(action.type).to.equal(configInput.type);
  });

  test('Check methods getter returns valid  action methods', function() {
    chai.expect(action.methods).to.eql(configInput.methods);
  });

  test('Check source getter returns valid  action source', function() {
    chai.expect(action.source).to.equal(configInput.source);
  });

  test('Check extract() method returns valid action object', function() {
    chai.expect(action.extract()).to.eql(configInput);
  });

  test('Check NO_CACHE static getter returns number', function() {
    let actualResult = (typeof Action.NO_CACHE === 'number' && isFinite(Action.NO_CACHE))
    chai.expect(actualResult).to.be.equal(true);
  });
});
