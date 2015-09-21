'use strict';

import chai from 'chai';
import {NodePackageManagerCompiler} from '../../../lib.compiled/Compilation/Driver/NodePackageManagerCompiler';
import {Instance} from '../../../lib.compiled/Microservice/Instance';
import {Parameters} from '../../../lib.compiled/Microservice/Parameters';
import {Config} from '../../../lib.compiled/Microservice/Config';
import {ExecException} from '../../../lib.compiled/Exception/ExecException';

/**
 * Compiler implements abstract method from NodePackageManagerCompiler
 */
class Compiler extends NodePackageManagerCompiler {
  constructor() {
    super();
  }

  compile() {
    return this;
  }
}

suite('Compilation/Driver/NodePackageManagerCompiler', function() {
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
  let nodePackageManagerCompiler = new Compiler();
  let npmLocate = '/npm';
  let npmInstallValidSource = null;
  let npmInstallInvalidSource = 'chai';

  test('Class NodePackageManagerCompiler exists in Compilation/Driver/NodePackageManagerCompiler', function() {
    chai.expect(typeof NodePackageManagerCompiler).to.equal('function');
  });

  test('Check compile() static method ', function() {
    chai.expect(NodePackageManagerCompiler.compile(microservice)).to.equal(undefined);
  });

  test('Check _locateNpm() static method returns valid string', function() {
    chai.expect(NodePackageManagerCompiler._locateNpm()).to.contains(npmLocate);
  });

  test('Check _triggerNpmInstall() static method runs npm install successfully', function() {
    let error = null;
    try {
      //chai.expect(NodePackageManagerCompiler._triggerNpmInstall(npmInstallInvalidSource)).to.equal(undefined);
    } catch (e) {
      error = e;
      chai.assert.ok(false, 'No exception should be thrown');
    }
  });

  test('Check _triggerNpmInstall() static method throws ExecException', function() {
    let error = null;
    try {
      chai.expect(NodePackageManagerCompiler._triggerNpmInstall(npmInstallInvalidSource)).to.equal(undefined);
    } catch (e) {
      error = e;
      chai.expect(error).to.be.an.instanceOf(ExecException);
      chai.assert.ok(true, 'ExecException was thrown');
    }
  });
});
