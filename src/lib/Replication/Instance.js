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
import {CloudFrontService} from './Service/CloudFrontService';
import {Route53Service} from './Service/Route53Service';
import {AbstractStrategy as AbstractPublishStrategy} from './Publish/AbstractStrategy';

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

    this._route53Service = new Route53Service(this);
    this._route53Service.route53 = new AWS.Route53();

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
   * @returns {CloudFrontService}
   */
  get cloudFrontService() {
    return this._cloudFrontService;
  }

  /**
   * @returns {Route53Service}
   */
  get route53Service() {
    return this._route53Service;
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
   * @param {Number} percentage
   * @param {Boolean} skipDNSActions
   * @returns {Promise}
   */
  publish(percentage, skipDNSActions) {
    let PublishStrategyProto = AbstractPublishStrategy.chooseStrategyProto(percentage);
    let publisherInstance = new PublishStrategyProto(this, skipDNSActions);

    return publisherInstance.publish(percentage).then(() => {
      return publisherInstance.config();
    });
  }

  /**
   * @param {Number} percentage
   * @param {Boolean} skipDNSActions
   * @param {Object} config
   * @returns {Promise}
   */
  update(percentage, skipDNSActions, config) {
    let PublishStrategyProto = AbstractPublishStrategy.chooseStrategyProto(percentage);
    let publisherInstance = new PublishStrategyProto(this, skipDNSActions);

    publisherInstance.updateConfig(config);

    return publisherInstance.update(percentage).then(() => {
      return publisherInstance.config();
    });
  }

  /**
   * @param {Object} resources
   * @returns {Promise}
   */
  checkStatus(resources) {
    let statusResult = {};

    return Promise.all(
      this.replicationManagers.map(replicationManger => {
        return replicationManger.checkStatus(resources[replicationManger.name()]).then(status => {
          if (status !== null) {
            statusResult[replicationManger.name()] = status;
          }
        });
      })
    ).then(() => statusResult);
  }

  /**
   * @returns {String}
   */
  static get BLUE_GREEN_MS_IDENTIFIER() {
    return 'deep-blue-green';
  }
}
