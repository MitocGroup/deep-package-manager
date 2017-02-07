/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import AWS from 'aws-sdk';
import {DynamoDBManager} from './Manager/DynamoDBManager';
import {LambdaManager} from './Manager/LambdaManager';

export class Instance {
  /**
   * @param {Object} replicationAppConfig
   * @param {Object} blueAppConfig
   * @param {Object} greenAppConfig
   */
  constructor(replicationAppConfig, blueAppConfig, greenAppConfig) {
    this._config = replicationAppConfig;
    this._blueConfig = blueAppConfig;
    this._greenConfig = greenAppConfig;

    AWS.config.update(this._config.aws);

    this._dynamoDbManager = new DynamoDBManager(this);
    this._dynamoDbManager.dynamoDb = new AWS.DynamoDB();

    this._lambdaManager = new LambdaManager(this);
    this._lambdaManager.lambda = new AWS.Lambda();
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  prepare(tables) {
    return Promise.all(
      tables.map(table => {
        return this._dynamoDbManager.enableDynamoDBStreams(table)
          .then(tableConfig => {
            return this._lambdaManager.createDynamoDBStreamTriggerFunction(tableConfig.LatestStreamArn);
          })
          .then(() => {
            console.debug(`"${table}" table replication has been prepared.`);
          });
      })
    );
  }
}
