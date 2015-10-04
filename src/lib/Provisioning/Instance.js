/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import Core from '@mitocgroup/deep-core';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import {S3Service} from './Service/S3Service';
import {CognitoIdentityService} from './Service/CognitoIdentityService';
import {IAMService} from './Service/IAMService';
import {CloudFrontService} from './Service/CloudFrontService';
import {SNSService} from './Service/SNSService';
import {LambdaService} from './Service/LambdaService';
import {KinesisService} from './Service/KinesisService';
import {DynamoDBService} from './Service/DynamoDBService';
import {ElasticacheService} from './Service/ElasticacheService';
import {APIGatewayService} from './Service/APIGatewayService';
import {Instance as PropertyInstance} from '../Property/Instance';
import {WaitFor} from '../Helpers/WaitFor';
import {Client as AwsApiGatewayClient} from 'aws-api-gw-client';

/**
 * Provisioning instance
 */
export class Instance {
  /**
   * @param {PropertyInstance} property
   */
  constructor(property) {
    if (!(property instanceof PropertyInstance)) {
      throw new InvalidArgumentException(property, PropertyInstance);
    }

    this._property = property;

    this._s3 = new property.AWS.S3();
    this._elasticache = new property.AWS.ElastiCache();
    this._sns = new property.AWS.SNS();
    this._cloudFront = new property.AWS.CloudFront();
    this._iam = new property.AWS.IAM();

    // set appropriate region for services that are not available on all regions
    this._dynamoDb = new property.AWS.DynamoDB({
      region: this.getAwsServiceRegion(DynamoDBService, property.config.awsRegion),
    });

    this._kinesis = new property.AWS.Kinesis({
      region: this.getAwsServiceRegion(KinesisService, property.config.awsRegion),
    });
    this._lambda = new property.AWS.Lambda({
      region: this.getAwsServiceRegion(LambdaService, property.config.awsRegion),
    });
    this._cognitoIdentity = new property.AWS.CognitoIdentity({
      region: this.getAwsServiceRegion(CognitoIdentityService, property.config.awsRegion),
    });

    // @todo - replace this client with AWS native one than it'll be available
    this._apiGateway = new AwsApiGatewayClient({
      accessKeyId: property.AWS.config.credentials.accessKeyId,
      secretAccessKey: property.AWS.config.credentials.secretAccessKey,
      region: this.getAwsServiceRegion(CognitoIdentityService, property.config.awsRegion),
    });

    this._config = {};

    this._services = null;
  }

  /**
   * @param {Function} awsService
   * @param {string} defaultRegion
   * @returns {string}
   */
  getAwsServiceRegion(awsService, defaultRegion) {
    return Core.AWS.Region.getAppropriateAwsRegion(
      defaultRegion,
      awsService.AVAILABLE_REGIONS
    );
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * @param {Object} cfg
   */
  set config(cfg) {
    this._config = cfg;
  }

  /**
   * @returns {PropertyInstance}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Object}
   */
  get s3() {
    return this._s3;
  }

  /**
   * @returns {Object}
   */
  get dynamoDB() {
    return this._dynamoDb;
  }

  /**
   * @returns {Object}
   */
  get elasticCache() {
    return this._elasticache;
  }

  /**
   * @returns {Object}
   */
  get kinesis() {
    return this._kinesis;
  }

  /**
   * @returns {Object}
   */
  get sns() {
    return this._sns;
  }

  /**
   * @returns {Object}
   */
  get lambda() {
    return this._lambda;
  }

  /**
   * @returns {Object}
   */
  get iam() {
    return this._iam;
  }

  /**
   * @returns {Object}
   */
  get cognitoIdentity() {
    return this._cognitoIdentity;
  }

  /**
   * @returns {Object}
   */
  get cloudFront() {
    return this._cloudFront;
  }

  /**
   * @returns {Object}
   */
  get apiGateway() {
    return this._apiGateway;
  }

  /**
   * @returns {Core.Generic.ObjectStorage}
   */
  get services() {
    if (this._services === null) {
      // @todo - add only required services that are configured in appConfig file
      this._services = new Core.Generic.ObjectStorage([
        new S3Service(this),
        new ElasticacheService(this),
        new DynamoDBService(this),
        new KinesisService(this),
        new SNSService(this),
        new IAMService(this),
        new CognitoIdentityService(this),
        new CloudFrontService(this),
        new LambdaService(this),
        new APIGatewayService(this),
      ]);
    }

    return this._services;
  }

  /**
   * @todo: split update into a separate method
   *
   * @param {Function} callback
   * @param {Boolean} isUpdate
   */
  create(callback, isUpdate = false) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    let services = this.services;
    let wait = new WaitFor();
    let servicesVector = services.iterator;
    let remaining = servicesVector.length;

    // @todo: improve this
    if (isUpdate) {
      for (let service of servicesVector) {
        service.isUpdate = true;
      }
    }

    for (let service of servicesVector) {
      service.setup(services).ready(function() {
        this._config[service.name()] = service.config();
        remaining--;
      }.bind(this));
    }

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(function() {
      let subWait = new WaitFor();

      let subRemaining = servicesVector.length;

      for (let service of servicesVector) {
        service.postProvision(services).ready(function() {
          // @todo: why is this resetting the object?
          //this._config[service.name()] = service.config();
          subRemaining--;
        }.bind(this));
      }

      subWait.push(function() {
        return subRemaining <= 0;
      }.bind(this));

      subWait.ready(function() {
        callback(this._config);
      }.bind(this));
    }.bind(this));
  }

  /**
   * @param {Function} callback
   * @param {Boolean} isUpdate
   */
  postDeployProvision(callback, isUpdate = false) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    let services = this.services;
    let wait = new WaitFor();
    let servicesVector = services.iterator;
    let remaining = servicesVector.length;

    // @todo: improve this
    if (isUpdate) {
      for (let service of servicesVector) {
        service.isUpdate = true;
      }
    }

    for (let service of servicesVector) {
      service.postDeployProvision(services).ready(function() {
        // @todo: why is this resetting the object?
        //this._config[service.name()] = service.config();
        remaining--;
      }.bind(this));
    }

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(function() {
      callback(this._config);
    }.bind(this));
  }
}
