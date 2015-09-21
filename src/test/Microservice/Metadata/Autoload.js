'use strict';

import chai from 'chai';
import {Autoload} from '../../../lib.compiled/Microservice/Metadata/Autoload';

suite('Microservice/Metadata/Autoload', function() {
  let configInput = {
    backend: 'Backend',
    docs: 'Docs',
    frontend: 'Frontend',
    models: 'Models',
  };
  let basePath = 'basePath';
  let configExpectedResult = {
    backend: `${basePath}/${configInput.backend}`,
    docs: `${basePath}/${configInput.docs}`,
    frontend: `${basePath}/${configInput.frontend}`,
    models: `${basePath}/${configInput.models}`,
  };

  let autoload = new Autoload(configInput, basePath);

  test('Class Autoload exists in Microservice/Metadata/Autoload', function() {
    chai.expect(typeof Autoload).to.equal('function');
  });

  test('Check frontend getter returns valid value for frontend', function() {
    chai.expect(autoload.frontend).to.be.equal(`${basePath}/${configInput.frontend}`);
  });

  test('Check backend getter returns valid value for backend', function() {
    chai.expect(autoload.backend).to.be.equal(configExpectedResult.backend);
  });

  test('Check docs getter returns valid value for docs', function() {
    chai.expect(autoload.docs).to.be.equal(configExpectedResult.docs);
  });

  test('Check models getter returns valid value for models', function() {
    chai.expect(autoload.models).to.be.equal(configExpectedResult.models);
  });

  test('Check extract method returns valid istance of Autoload', function() {
    chai.expect(autoload.extract()).to.be.eql(configExpectedResult);
  });
});

