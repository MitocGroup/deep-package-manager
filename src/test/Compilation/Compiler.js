'use strict';

import chai from 'chai';
import {Compiler} from '../../lib.compiled/Compilation/Compiler';
import {Instance} from '../../lib.compiled/Microservice/Instance';
import {Parameters} from '../../lib.compiled/Microservice/Parameters';
import {Config} from '../../lib.compiled/Microservice/Config';

suite('Compilation/Compiler', function() {
  let configInput = {
    name: 'config',
    propertyRoot: false,
    description: 'Config unit test',
    identifier: 'unit_test',
    version: '0.0.1',
    dependencies: {},
    autoload: {
      backend: 'Backend',
      docs: 'Docs',
      frontend: 'Frontend',
      models: 'Models',
    },
  };
  let config = new Config(configInput);
  let parameters = new Parameters();
  let basePath = 'basePath';
  let microservice = new Instance(config, parameters, basePath);

  let compiler = new Compiler();

  test('Class Compiler exists in Compilation/Compiler', function() {
    chai.expect(typeof Compiler).to.equal('function');
  });

  test('Class compiler successfully created', function() {
    chai.expect(compiler).to.not.equal(null);
  });

  test('Check compilers static getter returns []', function() {
    chai.expect(Compiler.compilers).to.be.eql([]);
  });

  test('Check compile() static method compiles microservice by using all compilers', function() {
    //todo - TBD
    chai.expect(Compiler.compile(microservice)).to.be.not.equal(null);
  });

  test('Check buildLambdas() static method builds Lambdas', function() {
    //todo - TBD
    chai.expect(Compiler.buildLambdas(microservice)).to.be.not.equal(null);
  });
});
