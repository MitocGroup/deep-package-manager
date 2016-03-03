'use strict';

import chai from 'chai';
import {Action} from '../../../lib/Microservice/Metadata/Action';

suite('Microservice/Metadata/Action', () => {
  let configInput = {
    cacheTtl: 60,
    cacheEnabled: true,
    identifier: 'test identifier',
    resourceName: 'testResourceName',
    name: 'testActionName',
    description: 'Lambda for retrieve counts',
    type: 'lambda',
    source: 'src/Property/RetrieveCounts',
    validationSchema: 'Sample',
    scope: 'public',
    engine: {
      memory: 120,
      timeout: 60,
      runtime: 'nodejs',
    },
    methods: ['GET', 'POST'],
    forceUserIdentity: true,
  };

  let action = new Action(configInput.resourceName, configInput.name, configInput);

  test('Class Action exists in Microservice/Metadata/Action', () => {
    chai.expect(Action).to.be.an('function');
  });

  test('Check HTTP_VERBS static getter returns \'external\'', () => {
    chai.expect(Action.HTTP_VERBS.length).to.be.equal(7);
    chai.expect(Action.HTTP_VERBS).to.be.include('GET');
    chai.expect(Action.HTTP_VERBS).to.be.include('POST');
    chai.expect(Action.HTTP_VERBS).to.be.include('DELETE');
    chai.expect(Action.HTTP_VERBS).to.be.include('HEAD');
    chai.expect(Action.HTTP_VERBS).to.be.include('PUT');
    chai.expect(Action.HTTP_VERBS).to.be.include('OPTIONS');
    chai.expect(Action.HTTP_VERBS).to.be.include('PATCH');
  });

  test('Check LAMBDA static getter returns \'lambda\'', () => {
    chai.expect(Action.LAMBDA).to.be.equal('lambda');
  });

  test('Check EXTERNAL static getter returns \'external\'', () => {
    chai.expect(Action.EXTERNAL).to.be.equal('external');
  });

  test('Check resourceName getter returns valid resourceName', () => {
    chai.expect(action.resourceName).to.equal(configInput.resourceName);
  });

  test('Check name getter returns valid action name', () => {
    chai.expect(action.name).to.equal(configInput.name);
  });

  test('Check identifier getter returns valid identifier', () => {
    configInput.identifier = action.identifier;
    chai.expect(action.identifier).to.equal(`${configInput.resourceName}-${configInput.name}`);
  });

  test('Check description getter returns valid action description', () => {
    chai.expect(action.description).to.equal(configInput.description);
  });

  test('Check type getter returns valid action type', () => {
    chai.expect(action.type).to.equal(configInput.type);
  });

  test('Check methods getter returns valid action methods', () => {
    chai.expect(action.methods).to.eql(configInput.methods);
  });

  test('Check source getter returns valid action source', () => {
    chai.expect(action.source).to.equal(configInput.source);
  });

  test('Check validationSchema getter returns valid action validationSchema', () => {
    chai.expect(action.validationSchema).to.equal(configInput.validationSchema);
  });

  test('Check extract() method returns valid action object', () => {
    let expectedResult = {
      cacheTtl: 60,
      cacheEnabled: true,
      identifier: 'testResourceName-testActionName',
      resourceName: 'testResourceName',
      name: 'testActionName',
      description: 'Lambda for retrieve counts',
      type: 'lambda',
      source: 'src/Property/RetrieveCounts',
      validationSchema: 'Sample',
      cron: null,
      cronPayload: null,
      scope: 3,
      engine: {
        memory: 120,
        timeout: 60,
        runtime: 'nodejs',
      },
      methods: ['GET', 'POST'],
      forceUserIdentity: true,
    };

    action = new Action(configInput.resourceName, configInput.name, configInput);
    chai.expect(action.extract()).to.eql(expectedResult);
  });

  test('Check NO_CACHE static getter returns number', () => {
    let actualResult = (typeof Action.NO_CACHE === 'number' && isFinite(Action.NO_CACHE))
    chai.expect(actualResult).to.be.equal(true);
  });
});
