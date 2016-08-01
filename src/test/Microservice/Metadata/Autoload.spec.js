'use strict';

import chai from 'chai';
import {Autoload} from '../../../lib/Microservice/Metadata/Autoload';

suite('Microservice/Metadata/Autoload', () => {
  let configInput = {
    backend: 'Backend',
    docs: 'Docs',
    frontend: 'Frontend',
    models: 'Data/Models',
    validation: 'Data/Validation',
    fixtures: 'Data/Fixtures',
    migration: 'Data/Migration',
    roles: 'Data/Roles',
  };
  let basePath = 'basePath';
  let configExpectedResult = {
    backend: `${basePath}/${configInput.backend}`,
    docs: `${basePath}/${configInput.docs}`,
    frontend: `${basePath}/${configInput.frontend}`,
    models: `${basePath}/${configInput.models}`,
    validation: `${basePath}/${configInput.validation}`,
    fixtures: `${basePath}/${configInput.fixtures}`,
    migration: `${basePath}/${configInput.migration}`,
    roles: `${basePath}/${configInput.roles}`,
  };

  let autoload = new Autoload(configInput, basePath);

  test('Class Autoload exists in Microservice/Metadata/Autoload', () => {
    chai.expect(Autoload).to.be.an('function');
  });

  test('Check frontend getter returns valid value for frontend', () => {
    chai.expect(autoload.frontend).to.be.equal(configExpectedResult.frontend);
  });

  test('Check backend getter returns valid value for backend', () => {
    chai.expect(autoload.backend).to.be.equal(configExpectedResult.backend);
  });

  test('Check docs getter returns valid value for docs', () => {
    chai.expect(autoload.docs).to.be.equal(configExpectedResult.docs);
  });

  test('Check models getter returns valid value for models', () => {
    chai.expect(autoload.models).to.be.equal(configExpectedResult.models);
  });

  test('Check validation getter returns valid value for validation', () => {
    chai.expect(autoload.validation).to.be.equal(configExpectedResult.validation);
  });

  test('Check fixtures getter returns valid value for fixtures', () => {
    chai.expect(autoload.fixtures).to.be.equal(configExpectedResult.fixtures);
  });

  test('Check migration getter returns valid value for migration', () => {
    chai.expect(autoload.migration).to.be.equal(configExpectedResult.migration);
  });

  test('Check roles getter returns valid value for migration', () => {
    chai.expect(autoload.roles).to.be.equal(configExpectedResult.roles);
  });

  test('Check extract method returns valid istance of Autoload', () => {
    chai.expect(autoload.extract()).to.be.eql(configExpectedResult);
  });
});

