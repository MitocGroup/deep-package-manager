'use strict';

import chai from 'chai';
import {Compiler} from '../../lib/Compilation/Compiler';
import {Instance} from '../../lib/Microservice/Instance';
import {Parameters} from '../../lib/Microservice/Parameters';
import {Config} from '../../lib/Microservice/Config';

suite('Compilation/Compiler', () => {
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

  test('Class Compiler exists in Compilation/Compiler', () => {
    chai.expect(Compiler).to.be.an('function');
  });

  test('Class compiler successfully created', () => {
    chai.expect(compiler).to.not.equal(null);
  });

  test('Check compilers static getter returns []', () => {
    chai.expect(Compiler.compilers).to.be.eql([]);
  });

  test('Check compile() static method compiles microservice by using all compilers', () => {
    //todo - TBD
    chai.expect(Compiler.compile(microservice)).to.be.not.equal(null);
  });

  test('Check buildLambdas() static method builds Lambdas', () => {
    //todo - TBD
    chai.expect(Compiler.buildLambdas(microservice)).to.be.not.equal(null);
  });
});
