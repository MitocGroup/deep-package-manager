/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import Core from 'deep-core';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import {AbstractService} from './Service/AbstractService';
import {S3Service} from './Service/S3Service';
import {CognitoIdentityService} from './Service/CognitoIdentityService';
import {IAMService} from './Service/IAMService';
import {CloudFrontService} from './Service/CloudFrontService';
import {ACMService} from './Service/ACMService.js';
import {SNSService} from './Service/SNSService';
import {LambdaService} from './Service/LambdaService';
import {KinesisService} from './Service/KinesisService';
import {DynamoDBService} from './Service/DynamoDBService';
import {ElasticacheService} from './Service/ElasticacheService';
import {APIGatewayService} from './Service/APIGatewayService';
import {SQSService} from './Service/SQSService';
import {CloudWatchLogsService} from './Service/CloudWatchLogsService';
import {Instance as PropertyInstance} from '../Property/Instance';
import {WaitFor} from '../Helpers/WaitFor';

/**
 * Provisioning instance
 */
export class Instance {
  /**
   * @param {PropertyInstance|*} property
   */
  constructor(property) {
    if (!(property instanceof PropertyInstance)) {
      throw new InvalidArgumentException(property, PropertyInstance);
    }

    this._property = property;

    // deep-db instance
    this._db = null;

    this._ec2 = new property.AWS.EC2(); // used for security groups retrieval
    this._elasticache = new property.AWS.ElastiCache();
    this._sns = new property.AWS.SNS();
    this._cloudFront = new property.AWS.CloudFront();
    this._iam = new property.AWS.IAM();
    this._cloudWatchLogs = new property.AWS.CloudWatchLogs();

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
    this._apiGateway = new property.AWS.APIGateway({
      region: this.getAwsServiceRegion(APIGatewayService, property.config.awsRegion),
    });
    this._sqs = new property.AWS.SQS({
      region: this.getAwsServiceRegion(SQSService, property.config.awsRegion),
    });
    this._acm = new property.AWS.ACM({
      region: this.getAwsServiceRegion(ACMService, property.config.awsRegion),
    });

    // set region for services that depend on other services region
    this._s3 = new property.AWS.S3({

      // This bucket must reside in the same AWS region where you are creating the Lambda function
      region: this._lambda.config.region,
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
   * @returns {DB}
   */
  get db() {
    return this._db;
  }

  /**
   * In order to make possible DB manipulations
   * in post provision hook
   *
   * @param {DB} instance
   */
  set db(instance) {
    this._db = instance;
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
   * @returns {AWS.EC2|*}
   */
  get ec2() {
    return this._ec2;
  }

  /**
   * @returns {AWS.ACM|*}
   */
  get acm() {
    return this._acm;
  }

  /**
   * @returns {AWS.CloudWatchLogs|*}
   */
  get cloudWatchLogs() {
    return this._cloudWatchLogs;
  }

  /**
   * @returns {AWS.S3|*}
   */
  get s3() {
    return this._s3;
  }

  /**
   * @returns {AWS.DynamoDB|*}
   */
  get dynamoDB() {
    return this._dynamoDb;
  }

  /**
   * @returns {@returns {AWS.ElastiCache|*}}
   */
  get elasticCache() {
    return this._elasticache;
  }

  /**
   * @returns {@returns {AWS.Kinesis|*}}
   */
  get kinesis() {
    return this._kinesis;
  }

  /**
   * @returns {@returns {AWS.SNS|*}}
   */
  get sns() {
    return this._sns;
  }

  /**
   * @returns {@returns {AWS.Lambda|*}}
   */
  get lambda() {
    return this._lambda;
  }

  /**
   * @returns {@returns {AWS.IAM|*}}
   */
  get iam() {
    return this._iam;
  }

  /**
   * @returns {@returns {AWS.CognitoIdentity|*}}
   */
  get cognitoIdentity() {
    return this._cognitoIdentity;
  }

  /**
   * @returns {@returns {AWS.CloudFront|*}}
   */
  get cloudFront() {
    return this._cloudFront;
  }

  /**
   * @returns {@returns {AWS.ApiGateway|*}}
   */
  get apiGateway() {
    return this._apiGateway;
  }

  /**
   * @returns {@returns {AWS.SNS|*}}
   */
  get sqs() {
    return this._sqs;
  }

  /**
   * @param {String} name
   * @returns {Object}
   */
  getAwsServiceByName(name) {
    switch (name) {
      case 'IAM':
      case 'SNS':
      case 'SQS':
      case 'ACM':
        name = name.toLowerCase();
        break;
      case 'APIGateway':
        name = 'apiGateway';
        break;
      default:
        name = AbstractService.lowerCaseFirst(name);
    }

    return this[name];
  }

  /**
   * @returns {Core.Generic.ObjectStorage}
   */
  get services() {
    if (this._services === null) {
      // @todo - add only required services that are configured in appConfig file
      this._services = new Core.Generic.ObjectStorage([
        new ElasticacheService(this),
        new S3Service(this),
        new DynamoDBService(this),
        new KinesisService(this),
        new SNSService(this),
        new IAMService(this),
        new CognitoIdentityService(this),
        new ACMService(this),
        new CloudFrontService(this),
        new LambdaService(this),
        new APIGatewayService(this),
        new SQSService(this),
        new CloudWatchLogsService(this),
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

    if (isUpdate) {
      for (let i in servicesVector) {
        if (!servicesVector.hasOwnProperty(i)) {
          continue;
        }

        let service = servicesVector[i];

        service.isUpdate = true;
      }
    }

    for (let i in servicesVector) {
      if (!servicesVector.hasOwnProperty(i)) {
        continue;
      }

      let service = servicesVector[i];

      service.setup(services).ready(() => {
        this._config[service.name()] = service.config();
        remaining--;
      });
    }

    wait.push(() => {
      return remaining <= 0;
    });

    wait.ready(() => {
      let subWait = new WaitFor();

      let subRemaining = servicesVector.length;

      for (let i in servicesVector) {
        if (!servicesVector.hasOwnProperty(i)) {
          continue;
        }

        let service = servicesVector[i];

        service.postProvision(services).ready(() => {
          // @todo: why is this resetting the object?
          //this._config[service.name()] = service.config();
          subRemaining--;
        });
      }

      subWait.push(() => {
        return subRemaining <= 0;
      });

      subWait.ready(() => {
        callback(this._config);
      });
    });
  }

  /**
   * @param {Object|null} config
   * @returns {Instance}
   */
  injectConfig(config = null) {
    if (config) {
      this._config = config;
    }

    let services = this.services;
    let servicesVector = services.iterator;

    let propertyProvisioning = this.property.config.provisioning;

    for (let i in servicesVector) {
      if (!servicesVector.hasOwnProperty(i)) {
        continue;
      }

      let service = servicesVector[i];

      service.injectConfig(propertyProvisioning[service.name()]);
    }

    return this;
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

    if (isUpdate) {
      for (let i in servicesVector) {
        if (!servicesVector.hasOwnProperty(i)) {
          continue;
        }

        let service = servicesVector[i];

        service.isUpdate = true;
      }
    }

    for (let i in servicesVector) {
      if (!servicesVector.hasOwnProperty(i)) {
        continue;
      }

      let service = servicesVector[i];

      service.postDeployProvision(services).ready(() => {
        // @todo: why is this resetting the object?
        //this._config[service.name()] = service.config();
        remaining--;
      });
    }

    wait.push(() => {
      return remaining <= 0;
    });

    wait.ready(() => {
      callback(this._config);
    });
  }
}
