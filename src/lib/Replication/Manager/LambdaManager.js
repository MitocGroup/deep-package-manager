/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import {AbstractManager} from './AbstractManager';
import Core from 'deep-core';

export class LambdaManager extends AbstractManager {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._lambda = null;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.LAMBDA;
  }

  /**
   * @param {Object} lambda
   */
  set lambda(lambda) {
    this._lambda = lambda;
  }

  /**
   * @param {String} table
   * @returns {Promise}
   */
  startTableBackFillLambda(table) {
    return this._lambda.invoke({
      FunctionName: this.backFillStartFunctionName,
      InvocationType: 'Event',
      LogType: 'None',
      Payload: JSON.stringify({
        Table: table,
        Hash: this.replication.hashCode + Date.now(),
      }),
    }).promise();
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  stopDynamoDBStreamTriggerFunctions(tables) {
    return this._lambda.listEventSourceMappings({
      FunctionName: this.replicationFunctionName,
    }).promise().then(response => {
      let events = response.EventSourceMappings;
      let eventUUIDs = [];

      for (let event of events) {
        let tableName = event.EventSourceArn.replace(
          //arn:aws:dynamodb:us-east-1:566686064739:table/DeepDevNamecb3200e6/stream/2017-02-13T13:59:36.071
          /^arn\:aws\:dynamodb\:[\d\w\-]+\:\d+\:table\/([\w\d\-]+)\/.+$/i, 
          '$1'
        );

        if (tables.indexOf(tableName) !== -1) {
          eventUUIDs.push(event.UUID);
        }
      }

      return Promise.all(
        eventUUIDs.map(uuid => {
          return this._lambda.deleteEventSourceMapping({
            UUID: uuid,
          }).promise();
        })
      );
    });
  }

  /**
   * @param {String} dynamoDbStreamArn
   * @param {Number} batchSize
   * @returns {Promise}
   */
  createDynamoDBStreamTriggerFunction(dynamoDbStreamArn, batchSize = 100) {
    return this._lambda.getFunction({
      FunctionName: this.replicationFunctionName,
    }).promise().then(functionMetadata => {
      let functionCfg = functionMetadata.Configuration;

      delete functionCfg.CodeSize;
      delete functionCfg.CodeSha256;
      delete functionCfg.KMSKeyArn;
      delete functionCfg.FunctionArn;
      delete functionCfg.LastModified;
      delete functionCfg.Version;
      delete functionCfg.VpcConfig;

      Object.assign(functionCfg, {
        Environment: {
          Variables: this.replication.dynamoDbManager.buildTableReplicationMap(),
        },
      });

      return this._lambda.updateFunctionConfiguration(functionCfg).promise().then(() => functionCfg);
    }).then(functionCfg => {
      let payload = {
        EventSourceArn: dynamoDbStreamArn,
        FunctionName: functionCfg.FunctionName,
        BatchSize: batchSize,
        Enabled: true,
        StartingPosition: 'TRIM_HORIZON',
      };

      return this._lambda.createEventSourceMapping(payload).promise()
        .catch(e => {
          if (this._isFalsePositive(e)) {
            return Promise.resolve({});
          }

          throw e;
        });
    });
  }

  /**
   * @returns {String}
   */
  get replicationFunctionName() {
    return this.blueConfig().names['deep-blue-green']['replication-stream'];
  }

  /**
   * @returns {String}
   */
  get backFillStartFunctionName() {
    return this.blueConfig().names['deep-blue-green']['replication-start'];
  }

  /**
   * @param {Error} error
   * @returns {Boolean}
   * @private
   */
  _isFalsePositive(error) {
    return [
      'ResourceConflictException',
    ].indexOf(error.code) !== -1;
  }
}
