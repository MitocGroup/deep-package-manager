'use strict';

import chai from 'chai';
import {APIGatewayService} from '../../../lib.compiled/Provisioning/Service/APIGatewayService';
import Core from 'deep-core';

suite('Provisioning/Service/APIGatewayService', function() {
  let apiGatewayService = new APIGatewayService();

  test('Class APIGatewayService exists in Provisioning/Service/APIGatewayService', function() {
    chai.expect(typeof APIGatewayService).to.equal('function');
  });

  test('Check constructor sets valid default values', function() {
    chai.expect(apiGatewayService._readyTeardown).to.be.equal(false);
    chai.expect(apiGatewayService._ready).to.be.equal(false);
  });

  test(`Check name() method returns \'${Core.AWS.Service.API_GATEWAY}\'`, function() {
    chai.expect(apiGatewayService.name()).to.be.equal(Core.AWS.Service.API_GATEWAY);
  });

  //todo - TBD
  test('Check AVAILABLE_REGIONS() static method returns array of available regions', function() {
    chai.expect(APIGatewayService.AVAILABLE_REGIONS.length).to.be.equal(3);
    chai.expect(APIGatewayService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_EAST_N_VIRGINIA);
    chai.expect(APIGatewayService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.US_WEST_OREGON);
    chai.expect(APIGatewayService.AVAILABLE_REGIONS).to.be.include(Core.AWS.Region.EU_IRELAND);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', function() {
    chai.expect(apiGatewayService._readyTeardown).to.be.equal(false);
    let actualResult = apiGatewayService._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', function() {
    // @todo - _postDeployProvision is an async call
    //apiGatewayService._ready = false;
    //let actualResult = apiGatewayService._postDeployProvision('service');
    //chai.expect(actualResult._ready).to.be.equal(true);
  });

  test('Check getMethodJsonTemplate() method returns {\'application/json\':\'\'}', function() {
    let expectedResult = {
      'application/json': '',
    };
    chai.expect(apiGatewayService.getMethodJsonTemplate()).to.be.eql(expectedResult);
  });

  test('Check getMethodJsonTemplate() method returns valid object', function() {
    let expectedResult = {
      'application/json': '{"statusCode": 200}',
    };
    chai.expect(apiGatewayService.getMethodJsonTemplate('OPTIONS')).to.be.eql(expectedResult);
  });

  test('Check ALLOWED_CORS_HEADERS static getter returns valid string', function() {
    chai.expect(APIGatewayService.ALLOWED_CORS_HEADERS).to.be.equal("'Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization'");
  });

  test('Check jsonEmptyModel getter returns valid { "application/json": "Empty" }', function() {
    let expectedResult = {
      'application/json': 'Empty',
    };
    chai.expect(apiGatewayService.jsonEmptyModel).to.be.eql(expectedResult);
  });

  test('Check _getIntegrationTypeParams getter for httpMethod === "OPTIONS"', function() {
    let expectedResult = {
      type: 'MOCK',
      requestTemplates: {
        'application/json':  '{"statusCode": 200}',
      },
    };
    let type = 'testType';
    let httpMethod = 'OPTIONS';
    let uri = 'http://deep.mg';
    chai.expect(apiGatewayService._getIntegrationTypeParams(type, httpMethod, uri)).to.be.eql(expectedResult);
  });

  test('Check _getIntegrationTypeParams getter for httpMethod !== "OPTIONS"', function() {
    let type = 'testType';
    let httpMethod = 'GET';
    let uri = 'http://deep.mg';
    let expectedResult = {
      type: type,
      uri: uri,
      integrationHttpMethod: httpMethod,
      requestTemplates: {
        'application/json': '',
      },
    };
    chai.expect(apiGatewayService._getIntegrationTypeParams(type, httpMethod, uri)).to.be.eql(expectedResult);
  });
});
