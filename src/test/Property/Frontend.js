'use strict';

import chai from 'chai';
import {Frontend} from '../../lib.compiled/Property/Frontend';

suite('Property/Frontend', function() {
  let basePath = './Property/';
  let basePathTrimmed = './Property';
  let microservicesConfig = {};
  let moduleIdentifier = 'identifierTest';
  let frontend = new Frontend(microservicesConfig, basePath);

  test('Class Frontend exists in Property/Frontend', function() {
    chai.expect(typeof Frontend).to.equal('function');
  });

  test('Check constructor sets valid values', function() {
    chai.expect(frontend.basePath).to.be.equal(basePathTrimmed);
    chai.expect(frontend._microservicesConfig).to.be.eql(microservicesConfig);
  });

  test('Check path getter returns valid path', function() {
    chai.expect(frontend.path).to.be.equal(`${frontend.basePath}/_public`);
  });

  test('Check modulePath() method returns valid path', function() {
    chai.expect(frontend.modulePath(moduleIdentifier)).to.be.equal(`${frontend.path}/${moduleIdentifier}`);
  });

  test('Check configPath getter returns valid path', function() {
    chai.expect(frontend.configPath).to.be.equal(`${frontend.path}/_config.json`);
  });
});