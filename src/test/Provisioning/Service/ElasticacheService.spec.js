'use strict';

import chai from 'chai';
import {ElasticacheService} from '../../../lib/Provisioning/Service/ElasticacheService';

suite('Provisioning/Service/ElasticacheService', () => {
  let elasticacheService = new ElasticacheService();

  test('Class ElasticacheService exists in Provisioning/Service/ElasticacheService', () => {
    chai.expect(ElasticacheService).to.be.an('function');
  });

  test('Check constructor sets valid default values', () => {
    chai.expect(elasticacheService._readyTeardown).to.be.equal(false);
    chai.expect(elasticacheService._ready).to.be.equal(false);
  });

  test('Check name() method returns \'elasticache\'', () => {
    chai.expect(elasticacheService.name()).to.be.equal('elasticache');
  });

  test('Check _setup() method returns this._ready=\'true\'', () => {
    chai.expect(elasticacheService._ready).to.be.equal(false);
    let actualResult = elasticacheService._setup('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', () => {
    chai.expect(elasticacheService._readyTeardown).to.be.equal(false);
    let actualResult = elasticacheService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', () => {
    elasticacheService._ready = false;
    let actualResult = elasticacheService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check WAIT_TIME static getter returns number more than 0', () => {
    chai.expect(ElasticacheService.WAIT_TIME).to.be.above(0);
  });

  test('Check INSTANCE static getter returns number more than 0', () => {
    chai.expect(ElasticacheService.INSTANCE).to.be.equal('cache.t2.micro');
  });

  test('Check ENGINE static getter returns number more than 0', () => {
    chai.expect(ElasticacheService.ENGINE).to.be.equal('redis');
  });
});
