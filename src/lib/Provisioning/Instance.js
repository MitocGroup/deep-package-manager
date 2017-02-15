/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import Core from 'deep-core';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import {AbstractService} from './Service/AbstractService';
import {S3Service} from './Service/S3Service';
import {CognitoIdentityService} from './Service/CognitoIdentityService';
import {CognitoIdentityProviderService} from './Service/CognitoIdentityProviderService';
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
import {CloudWatchEventsService} from './Service/CloudWatchEventsService';
import {ESService} from './Service/ESService';
import {Instance as PropertyInstance} from '../Property/Instance';
import {WaitFor} from '../Helpers/WaitFor';
import {Tagging} from './ResourceTagging/Tagging';
import {SESService} from './Service/SESService';
import objectMerge from 'object-merge';

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
    this._cognitoIdentityServiceProvider = new property.AWS.CognitoIdentityServiceProvider({
      region: this.getAwsServiceRegion(CognitoIdentityProviderService, property.config.awsRegion),
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
    this._elasticsearch = new property.AWS.ES({
      region: this.getAwsServiceRegion(ESService, property.config.awsRegion),
    });
    this._ses = new property.AWS.SES({
      region: this.getAwsServiceRegion(SESService, property.config.awsRegion),
    });

    // set region for services that depend on other services region
    this._elasticache = new property.AWS.ElastiCache({
      region: this._lambda.config.region,
    });
    this._s3 = new property.AWS.S3({
      region: this._lambda.config.region,
    });
    this._cloudWatchEvents = new property.AWS.CloudWatchEvents({
      region: this._lambda.config.region,
    });
    this._cloudWatch = new property.AWS.CloudWatch({
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
   * @returns {AWS.CloudWatchEvents|*}
   */
  get cloudWatchEvents() {
    return this._cloudWatchEvents;
  }

  /**
   * @returns {AWS.CloudWatch|*}
   */
  get cloudWatch() {
    return this._cloudWatch;
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
   * @returns {AWS.ElastiCache|*}
   */
  get elasticCache() {
    return this._elasticache;
  }

  /**
   * @returns {AWS.Kinesis|*}
   */
  get kinesis() {
    return this._kinesis;
  }

  /**
   * @returns {AWS.SNS|*}
   */
  get sns() {
    return this._sns;
  }

  /**
   * @returns {AWS.Lambda|*}
   */
  get lambda() {
    return this._lambda;
  }

  /**
   * @returns {AWS.IAM|*}
   */
  get iam() {
    return this._iam;
  }

  /**
   * @returns {AWS.CognitoIdentity|*}
   */
  get cognitoIdentity() {
    return this._cognitoIdentity;
  }

  /**
   * @returns {AWS.CognitoIdentityServiceProvider|*}
   */
  get cognitoIdentityServiceProvider() {
    return this._cognitoIdentityServiceProvider;
  }

  /**
   * @returns {AWS.CloudFront|*}
   */
  get cloudFront() {
    return this._cloudFront;
  }

  /**
   * @returns {AWS.ApiGateway|*}
   */
  get apiGateway() {
    return this._apiGateway;
  }

  /**
   * @returns {AWS.SNS|*}
   */
  get sqs() {
    return this._sqs;
  }

  /**
   * @returns {AWS.SES|*}
   */
  get ses() {
    return this._ses;
  }

  /**
   * @returns {AWS.ES|*}
   */
  get elasticSearch() {
    return this._elasticsearch;
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
      case 'APIGatewayPlan':
        name = 'apiGateway';
        break;
      case 'ElastiCache':
        name = 'elasticCache';
        break;
      case 'ES':
        name = 'elasticSearch';
        break;
      case 'CognitoIdentityProvider':
        name = 'cognitoIdentityServiceProvider';
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
        new SESService(this),
        new IAMService(this),
        new CognitoIdentityService(this),
        new CognitoIdentityProviderService(this),
        new ACMService(this),
        new CloudFrontService(this),
        new LambdaService(this),
        new APIGatewayService(this),
        new SQSService(this),
        new CloudWatchLogsService(this),
        new CloudWatchEventsService(this),
        new ESService(this),
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
      this.isUpdate();
    }

    for (let i in servicesVector) {
      if (!servicesVector.hasOwnProperty(i)) {
        continue;
      }

      let service = servicesVector[i];

      console.debug(`Start provisioning "${service.name()}" service.`);

      service.setup(services).ready(() => {

        console.debug(`Service "${service.name()}" provisioned.`);

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

        console.debug(`Start post-provisioning for "${service.name()}" service.`);

        service.postProvision(services).ready(() => {

          console.debug(`Post-provisioning done for "${service.name()}" service.`);

          this._config[service.name()] = objectMerge(this._config[service.name()], service.config());
          subRemaining--;
        });
      }

      subWait.push(() => {
        return subRemaining <= 0;
      });

      subWait.ready(() => {
        if (isUpdate) {
          callback(this._config);
        } else {
          console.debug('Start tagging resources');

          Tagging.create(this._property).tag(() => {
            callback(this._config);
          });
        }
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
   * @param {Boolean} value
   */
  isUpdate(value = true) {
    let services = this.services;
    let servicesVector = services.iterator;

    for (let i in servicesVector) {
      if (!servicesVector.hasOwnProperty(i)) {
        continue;
      }

      let service = servicesVector[i];

      service.isUpdate = value;
    }
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
      this.isUpdate();
    }

    for (let i in servicesVector) {
      if (!servicesVector.hasOwnProperty(i)) {
        continue;
      }

      let service = servicesVector[i];

      console.debug(`Start post-deploy-provisioning for "${service.name()}" service.`);

      service.postDeployProvision(services).ready(() => {

        console.debug(`Post-deploy-provisioning done for "${service.name()}" service.`);

        this._config[service.name()] = objectMerge(this._config[service.name()], service.config());

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
