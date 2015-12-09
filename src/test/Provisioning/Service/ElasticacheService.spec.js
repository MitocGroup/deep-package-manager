'use strict';

import chai from 'chai';
import {ElasticacheService} from '../../../lib/Provisioning/Service/ElasticacheService';

suite('Provisioning/Service/ElasticacheService', function() {
  let elasticacheService = new ElasticacheService();

  test('Class ElasticacheService exists in Provisioning/Service/ElasticacheService', function() {
    chai.expect(typeof ElasticacheService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(elasticacheService._readyTeardown).to.be.equal(false);
    chai.expect(elasticacheService._ready).to.be.equal(false);
  });

  test('Check name() method returns \'elasticache\'', function() {
    chai.expect(elasticacheService.name()).to.be.equal('elasticache');
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0].length).to.be.equal(10);
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('*');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('ap-northeast-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('ap-southeast-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('ap-southeast-2');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('eu-central-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('eu-west-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('sa-east-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('us-east-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('us-west-1');
    chai.expect(ElasticacheService.AVAILABLE_REGIONS[0]).to.be.include('us-west-2');
  });

  test('Check _setup() method returns this._ready=\'true\'', function() {
    chai.expect(elasticacheService._ready).to.be.equal(false);
    let actualResult = elasticacheService._setup('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
    chai.expect(elasticacheService._readyTeardown).to.be.equal(false);
    let actualResult = elasticacheService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    elasticacheService._ready = false;
    let actualResult = elasticacheService._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check WAIT_TIME static getter returns number more than 0', function() {
    chai.expect(ElasticacheService.WAIT_TIME).to.be.above(0);
  });

  test('Check INSTANCE static getter returns number more than 0', function() {
    chai.expect(ElasticacheService.INSTANCE).to.be.equal('cache.t2.micro');
  });

  test('Check ENGINE static getter returns number more than 0', function() {
    chai.expect(ElasticacheService.ENGINE).to.be.equal('redis');
  });
});
