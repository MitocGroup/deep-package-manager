'use strict';

import chai from 'chai';
import {ResourceCollection} from '../../../lib.compiled/Microservice/Metadata/ResourceCollection';

suite('Microservice/Metadata/ResourceCollection', function() {
  let configInput = {};
  let configExpectedResult = {};
  let resourceCollection = new ResourceCollection(configInput);

  test('Class ResourceCollection exists in Microservice/Metadata/ResourceCollection', function () {
    chai.expect(typeof ResourceCollection).to.equal('function');
  });

  test('Check models getter returns valid value for models', function() {
    chai.expect(resourceCollection.actions).to.be.eql([]);
  });

  test('Check models getter returns valid value for models', function() {
    chai.expect(resourceCollection.rawResources).to.be.eql({});
  });

  test('Check extract() method returns valid value for models', function() {
    chai.expect(resourceCollection.extract()).to.be.eql({});
  });
});