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
        return manager.stop(resources[manager.name()]);
      })
    );
  }
}
