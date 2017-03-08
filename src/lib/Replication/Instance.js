/**
 * Created by CCristi on 2/6/17.
 */

/* eslint indent:0 */

'use strict';

import AWS from 'aws-sdk';
import {Hash} from '../Helpers/Hash';
import {S3Service} from './Service/S3Service';
import {DynamoDBService} from './Service/DynamoDBService';
import {LambdaService} from './Service/LambdaService';
import {DBManager} from './Manager/DBManager';
import {FSManager} from './Manager/FSManager';
import {CloudFrontEvent} from './Service/Helpers/CloudFrontEvent';
import {CloudFrontService} from './Service/CloudFrontService';

export class Instance {
  /**
   * @param {Object} blueAppConfig
   * @param {Object} greenAppConfig
   */
  constructor(blueAppConfig, greenAppConfig) {
    this._blueConfig = blueAppConfig;
    this._greenConfig = greenAppConfig;

    AWS.config.update(this._blueConfig.aws);

    this._dynamoDbService = new DynamoDBService(this);
    this._dynamoDbService.dynamoDb = new AWS.DynamoDB();

    this._lambdaService = new LambdaService(this);
    this._lambdaService.lambda = new AWS.Lambda();

    this._s3Service = new S3Service(this);
    this._s3Service.s3 = new AWS.S3();

    this._cloudFrontService = new CloudFrontService(this);
    this._cloudFrontService.cloudFrontClient = new AWS.CloudFront();

    this._replicationManagers = null;
  }

  /**
   * @returns {AbstractManager[]|DBManager[]}
   */
  get replicationManagers() {
    if (!this._replicationManagers) {
      this._replicationManagers = [
        new DBManager(this),
        new FSManager(this),
      ];
    }

    return this._replicationManagers;
  }

  /**
   * @returns {Object}
   */
  get blueConfig() {
    return this._blueConfig;
  }

  /**
   * @returns {Object}
   */
  get greenConfig() {
    return this._greenConfig;
  }

  /** 
   * @returns {DynamoDBService}
   */
  get dynamoDbService() {
    return this._dynamoDbService;
  }

  /**
   * @returns {LambdaService}
   */
  get lambdaService() {
    return this._lambdaService;
  }

  /**
   * @returns {S3Service}
   */
  get s3Service() {
    return this._s3Service;
  }

  /**
   * @returns {String}
   */
  get hashCode() {
    return Hash.crc32(
      [
        this._blueConfig.appIdentifier,
        this._blueConfig.awsAccountId,
        this._blueConfig.env,
      ].join('|')
        + '~' +
      [
        this._greenConfig.appIdentifier,
        this._greenConfig.awsAccountId,
        this._greenConfig.env,
      ].join('|')
    );
  }

  /**
   * @param {Object} resources
   * @returns {Promise}
   */
  prepare(resources) {
    return Promise.all(
      this.replicationManagers.map(manager => {
        console.info(`Preparing replication for "${manager.name()}" resources.`);

        return manager.prepare(resources[manager.name()]).then(() => {
          console.info(`"${manager.name()}" resources prepared.`);
        });
      })
    );
  }

  /**
   * @param {Object} resources
   * @returns {Promise}
   */
  start(resources) {
    return Promise.all(
      this.replicationManagers.map(manager => {
        console.info(`Starting blue-green replication for "${manager.name()}" resources.`);

        return manager.start(resources[manager.name()]).then(() => {
          console.info(`Blue-green replication is running for "${manager.name()} resources."`);
        });
      })
    );
  }

  /**
   * @param {Object} resources
   * @returns {Promise}
   */
  stop(resources) {
    return Promise.all(
      this.replicationManagers.map(manager => {
        console.info(`Stopping blue-green replication for "${manager.name()}" resources.`);

        return manager.stop(resources[manager.name()]).then(() => {
          console.info(`Blue-green replication has been stopped for "${manager.name()} resources."`);
        });
      })
    );
  }

  /**
   * @param {String} greenHostname
   * @param {String} domain
   * @param {Number} percentage
   * @returns {Promise}
   */
  publish(greenHostname, domain, percentage) {
    let cfDistributionId = this._cloudFrontService.blueConfig().id;
    let lambdaVariables = {
      'percentage': percentage,
      'domain-name': domain,
      'green-hostname': greenHostname,
    };

    return this._prepareCloudFrontLambda(
      this._lambdaService.cloudFrontTrafficManagerFunctionName,
      lambdaVariables,
      cfDistributionId,
      CloudFrontEvent.VIEWER_REQUEST
    ).then(() => {
      return this._prepareCloudFrontLambda(
        this._lambdaService.cloudFrontResponseEnhancerFunctionName,
        lambdaVariables,
        cfDistributionId,
        CloudFrontEvent.VIEWER_RESPONSE
      );
    });
  }

  /**
   * @param {String} functionName
   * @param {Object} variables
   * @param {String} cfDistributionId
   * @param {String} eventType
   * @returns {Promise}
   * @private
   */
  _prepareCloudFrontLambda(functionName, variables, cfDistributionId, eventType) {
    return this._lambdaService.compileLambdaForCloudFront(functionName, variables)
      .then(() => this.lambdaService.addLambdaEdgeInvokePermission(functionName, cfDistributionId))
      .then(() => {
        console.info(`Attaching "${functionName}" to ${cfDistributionId} ${eventType} event.`);
        
        return this._cloudFrontService.attachLambdaToDistributionEvent(
          this._lambdaService.generateLambdaArn(functionName),
          cfDistributionId,
          eventType
        );
      })
      .then(() => {
        console.info(`Function "${functionName} has been attached to ${cfDistributionId} ${eventType} event.`);
      });
  }

  /**
   * @returns {String}
   */
  static get BLUE_GREEN_MS_IDENTIFIER() {
    return 'deep-blue-green';
  }
}
