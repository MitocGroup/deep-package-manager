'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Instance as PropertyInstance} from '../../lib/Property/Instance';
import {Exception} from '../../lib/Exception/Exception';
import {DuplicateRootException} from '../../lib/Property/Exception/DuplicateRootException';
import {MissingRootException} from '../../lib/Property/Exception/MissingRootException';
import {InvalidArgumentException} from '../../lib/Exception/InvalidArgumentException';

chai.use(sinonChai);

suite('Property/Instance', () => {
  let propertyInstance = null;

  test('Class Instance exists in Property/Instance', () => {
    chai.expect(PropertyInstance).to.be.an('function');
  });

  test('Check constructor throws Exception if config file doesn\'t exist', () => {
    let e = null;
    let configPath = 'invalidPath';
    let configName = 'invalidConfig.json';
    try {
      new PropertyInstance(configPath, configName);
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(Exception);
    chai.expect(e.message).to.be.equal(`Missing ${configName} configuration file from ${configPath}.`);
  });

  test('Check constructor sets valid default values', () => {
    let e = null;
    try {
      propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.equal(null);
    chai.expect(propertyInstance.path).to.be.equal('test/testMaterials/Property2');
    chai.expect(propertyInstance._microservices).to.be.equal(null);
    chai.expect(propertyInstance.localDeploy).to.be.equal(false);
    chai.expect(propertyInstance.isUpdate).to.be.an.equal(false);
  });

  test('Check concurrentAsyncCount static getter returns value more than 1', () => {
    chai.expect(PropertyInstance.concurrentAsyncCount).to.be.above(1);
  });

  test('Check isUpdate getter returns valid values', () => {
    propertyInstance._isUpdate = false;
    chai.expect(propertyInstance.isUpdate).to.be.an.equal(false);
    propertyInstance._isUpdate = true;
    chai.expect(propertyInstance.isUpdate).to.be.an.equal(true);
    propertyInstance._isUpdate = false;
  });

  test('Check localDeploy setter sets value', () => {
    propertyInstance.localDeploy = false;
    chai.expect(propertyInstance.localDeploy).to.be.an.equal(false);
    propertyInstance.localDeploy = true;
    chai.expect(propertyInstance.localDeploy).to.be.an.equal(true);
    propertyInstance.localDeploy = false;
  });

  //test('Check fakeBuild() method', () => {
  //  let propertyInstance = new PropertyInstance('./test/testMaterials/Property1', 'deeploy.test.json');
  //  let lambdas = propertyInstance.fakeBuild();
  //
  //  chai.expect(lambdas).to.be.an('object');
  //});
  //
  //test('Check fakeBuild() method with a complete microservice', () => {
  //  let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');
  //
  //  //let lambdas = propertyInstance.fakeBuild();
  //
  //  //chai.expect(lambdas).to.be.an('object');
  //});
  //
  test('Check fakeBuild() method throws DuplicateRootException when there are 2 root microservices', () => {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property3', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.fakeBuild();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(DuplicateRootException);
  });

  test('Check fakeBuild() method throws MissingRootException when there are no root microservice', () => {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property4', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.fakeBuild();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(MissingRootException);
  });

  //test('Check build() method', () => {
  //  let propertyInstance = new PropertyInstance('./test/testMaterials/Property1', 'deeploy.test.json');
  //
  //  chai.expect(propertyInstance.build(() => {})).to.be.an.instanceOf(PropertyInstance);
  //});
  //
  test('Check build() method throws DuplicateRootException when there are 2 root microservices', () => {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property3', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.build(() => {});
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(DuplicateRootException);
  });

  test('Check build() method throws MissingRootException when there are no root microservices', () => {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property4', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.build(() => {});
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(MissingRootException);
  });

  test('Check build() method throws InvalidArgumentException when callback is not a function', () => {
    let propertyInstance = new PropertyInstance('./test/testMaterials/Property1', 'deeploy.test.json');
    let e = null;

    try {
      propertyInstance.build({});
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
  });

  //test('Check deploy() method to return a PropertyInstance', () => {
  //  let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');
  //
  //  propertyInstance.build(() => {
  //    propertyInstance.install(() => {
  //      chai.expect(propertyInstance.deploy(() => {})).to.be.an.instanceOf(PropertyInstance);
  //    });
  //  }, false);
  //});
  //
  //test('Check deploy() method with skip provisioning to return a PropertyInstance', () => {
  //  //TODO: Improve this test
  //  let e = null;
  //  let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');
  //
  //  propertyInstance.build(() => {
  //    try {
  //      propertyInstance.deploy(() => {});
  //    } catch (exception) {
  //      e = exception;
  //    }
  //
  //    chai.expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
  //    chai.expect(e).to.be.an.instanceOf(TypeError);
  //  }, true);
  //});
  //
  //test('Check install() method with correct property', () => {
  //  let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');
  //
  //  propertyInstance.install(() => {
  //    chai.expect(propertyInstance).to.be.an.instanceOf(PropertyInstance);
  //  });
  //});
  //
  test('Check deploy() method throws InvalidArgumentException for invalid argument', () => {
    let e = null;
    let spyCallback = sinon.spy();

    try {
      propertyInstance.deploy();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
    chai.expect(spyCallback).to.not.have.been.calledWith();
  });

  test('Check postDeploy() method throws InvalidArgumentException for invalid argument', () => {
    let e = null;
    let spyCallback = sinon.spy();

    try {
      propertyInstance.postDeploy();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
    chai.expect(spyCallback).to.not.have.been.calledWith();
  });

  test('Check install() method throws InvalidArgumentException for invalid argument', () => {
    let e = null;
    let spyCallback = sinon.spy();

    try {
      propertyInstance.install();
    } catch (exception) {
      e = exception;
    }

    chai.expect(e).to.be.an.instanceOf(InvalidArgumentException);
    chai.expect(spyCallback).to.not.have.been.calledWith();
  });
  //
  //test('Check fetchFrontendEngine() method', () => {
  //  let e = null;
  //  let spyCallback = sinon.spy();
  //
  //  try {
  //    propertyInstance.fetchFrontendEngine(spyCallback);
  //  } catch (exception) {
  //    e = exception;
  //  }
  //
  //  chai.expect(e).to.be.equal(null);
  //  chai.expect(spyCallback).to.not.have.been.calledWith();
  //});
  //
  //test('Check runInitMsHooks() method', () => {
  //  let e = null;
  //  let spyCallback = sinon.spy();
  //
  //  try {
  //    propertyInstance.runInitMsHooks(spyCallback);
  //  } catch (exception) {
  //    e = exception;
  //  }
  //
  //  chai.expect(e).to.be.equal(null);
  //  chai.expect(spyCallback).to.have.been.calledWith();
  //});
  //
  //test('Check _runPostDeployMsHooks() method', () => {
  //  let e = null;
  //  let spyCallback = sinon.spy();
  //
  //  try {
  //    propertyInstance._runPostDeployMsHooks(spyCallback);
  //  } catch (exception) {
  //    e = exception;
  //  }
  //
  //  chai.expect(e).to.be.equal(null);
  //  chai.expect(spyCallback).to.have.been.calledWith();
  //});
  //
  //test('Check buildFrontend() method returns object', () => {
  //  let e = null;
  //  let actualResult = null;
  //
  //  try {
  //    actualResult = propertyInstance.buildFrontend();
  //  } catch (exception) {
  //    e = exception;
  //  }
  //
  //  //todo - need to remove folder _public after test completed
  //  // AssertionError: expected [Error: EEXIST, file already exists './test/testMaterials/Property2/_public'] to equal null
  //  // chai.expect(e).to.be.equal(null);
  //  //chai.expect(typeof actualResult).to.be.equal('object');
  //});
  //
  //test('Check assureFrontendEngine() method', () => {
  //  let e = null;
  //  let spyCallback = sinon.spy();
  //
  //  try {
  //    propertyInstance.assureFrontendEngine(spyCallback);
  //  } catch (exception) {
  //    e = exception;
  //  }
  //
  //  chai.expect(e).to.be.equal(null);
  //  chai.expect(spyCallback).to.have.been.calledWith();
  //});

});
