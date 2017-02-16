/**
 * Created by CCristi on 2/6/17.
 */

/* eslint indent:0 */

'use strict';

import AWS from 'aws-sdk';
import {DynamoDBManager} from './Manager/DynamoDBManager';
import {LambdaManager} from './Manager/LambdaManager';
import {Hash} from '../Helpers/Hash';

export class Instance {
  /**
   * @param {Object} blueAppConfig
   * @param {Object} greenAppConfig
   */
  constructor(blueAppConfig, greenAppConfig) {
    this._blueConfig = blueAppConfig;
    this._greenConfig = greenAppConfig;

    AWS.config.update(this._blueConfig.aws);

    this._dynamoDbManager = new DynamoDBManager(this);
    this._dynamoDbManager.dynamoDb = new AWS.DynamoDB();

    this._lambdaManager = new LambdaManager(this);
    this._lambdaManager.lambda = new AWS.Lambda();
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
   * @returns {DynamoDBManager}
   */
  get dynamoDbManager() {
    return this._dynamoDbManager;
  }

  /**
   * @returns {LambdaManager}
   */
  get lambdaManager() {
    return this._lambdaManager;
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
   * @param {String[]} tables
   * @returns {Promise}
   */
  prepare(tables) {
    return Promise.all(
      tables
        .map(table => this._dynamoDbManager.getAwsBlueTableName(table))
        .map(table => {
          console.debug(`Enabling dynamoDB streams for "${table}"`);

          return this._dynamoDbManager
            .enableDynamoDBStreams(table)
            .then(tableConfig => {
              console.debug(`Enabling trigger function for "${tableConfig.LatestStreamArn}" stream.`);

              return this._lambdaManager.createDynamoDBStreamTriggerFunction(tableConfig.LatestStreamArn);
            })
            .then(() => {
              console.info(`"${table}" DynamoDB stream enabled.`);

              return this._lambdaManager.startTableBackFillLambda(table)
                .then(() => {
                  console.debug(`"${table}" table backfill started.`);
                });
            });
        })
    );
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  start(tables) {
    return Promise.all(
      tables
        .map(table => this._dynamoDbManager.getAwsGreenTableName(table))
        .map(table => {
          console.debug(`Enabling dynamoDB streams for "${table}"`);

          return this._dynamoDbManager
            .enableDynamoDBStreams(table)
            .then(tableConfig => {
              console.debug(`Enabling trigger function for "${tableConfig.LatestStreamArn}" stream.`);

              return this._lambdaManager.createDynamoDBStreamTriggerFunction(tableConfig.LatestStreamArn);
            })
            .then(() => {
              console.info(`"${table}" DynamoDB stream enabled.`);
            });
        })
    );
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   * @private
   */
  _stopTablesReplication(tables) {
    let stopTriggersPromise = this._lambdaManager
      .stopDynamoDBStreamTriggerFunctions(tables)
      .then(() => {
        console.debug(`Lambda replication triggers have been removed for "${tables.join(', ')}"`);
      });

    let stopDynamoDBStreamsPromises = tables.map(
      table => {
        return this._dynamoDbManager
          .disableDynamoDBStreams(table)
          .then(() => {
            console.debug(`DynamoDB streams have been disabled for "${table}"`);
          });
      }
    );

    return Promise.all([
      stopTriggersPromise,
      Promise.all(stopDynamoDBStreamsPromises),
    ]);
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  stop(tables) {
    return Promise.all([
      this._stopTablesReplication(tables.map(t => this._dynamoDbManager.getAwsBlueTableName(t))),
      this._stopTablesReplication(tables.map(t => this._dynamoDbManager.getAwsGreenTableName(t))),
    ]);
  }
}
