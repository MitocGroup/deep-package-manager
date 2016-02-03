'use strict';

import chai from 'chai';
import {ResourceCollection} from '../../../lib/Microservice/Metadata/ResourceCollection';

suite('Microservice/Metadata/ResourceCollection', () => {
  let configInput = {};
  let resourceCollection = new ResourceCollection(configInput);

  test('Class ResourceCollection exists in Microservice/Metadata/ResourceCollection', () => {
    chai.expect(typeof ResourceCollection).to.equal('function');
  });

  test('Check models getter returns valid value for models', () => {
    chai.expect(resourceCollection.actions).to.be.eql([]);
  });

  test('Check models getter returns valid value for models', () => {
    chai.expect(resourceCollection.rawResources).to.be.eql({});
  });

  test('Check extract() method returns valid value for models', () => {
    chai.expect(resourceCollection.extract()).to.be.eql({});
  });
});
