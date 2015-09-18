'use strict';

import chai from 'chai';
import {Lambda} from '../../lib.compiled/Property/Lambda';

suite('Property/Lambda', function() {

  let propertyInstance = {
    path: 'propertyPath',
  };
  let microserviceIdentifier = 'microserviceIdentifierTest';
  let identifier = 'lambdaIdentifierTest';
  let name = 'lambdaNameTest';
  let execRole = 'executeRole';
  let path = 'Property';
  let lambda = new Lambda(propertyInstance, microserviceIdentifier, identifier, name, execRole, path);


  test('Check constructor set valid default value for _property', function() {
    //chai.expect(lambda.).to.be.an.instanceOf(InvalidArgumentException);
  });


  test('Class Lambda exists in Property/Lambda', function() {
    chai.expect(typeof Lambda).to.equal('function');
  });

  test('Check DEFAULT_TIMEOUT static getter returns value above 0', function() {
    chai.expect(Lambda.DEFAULT_TIMEOUT).to.be.above(0);
  });

  test('Check DEFAULT_MEMORY_LIMIT static getter returns value above 0', function() {
    chai.expect(Lambda.DEFAULT_MEMORY_LIMIT).to.be.above(0);
  });

  test('Check HANDLER static getter returns \'bootstrap.handler\'', function() {
    chai.expect(Lambda.HANDLER).to.be.equal('bootstrap.handler');
  });

  test('Check CONFIG_FILE static getter returns \'_config.json\'', function() {
    chai.expect(Lambda.CONFIG_FILE).to.be.equal('_config.json');
  });

});