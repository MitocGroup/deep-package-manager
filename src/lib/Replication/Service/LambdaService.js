/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';

export class LambdaService extends AbstractService {
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
   * @param {String} bucket
   * @param {Date|String|Number} dateTime
   * @returns {*}
   */
  startS3BackFillLambda(bucket, dateTime = Date.now()) {
    return this._lambda.invoke({
      FunctionName: this.s3BackFillFunctionName,
      InvocationType: 'Event',
      LogType: 'None',
      Payload: JSON.stringify({
        Bucket: bucket,
        MaxDateTime: dateTime,
      }),
    }).promise();
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
   * @param {Object} ignoreGlobs
   * @returns {Promise}
   */
  injectEnvVarsIntoS3ReplicationLambdas(ignoreGlobs) {
    return Promise.all([
      this.s3ReplicationFunctionName,
      this.s3BackFillFunctionName,
    ].map(functionName => {
      return this._lambda.getFunction({
        FunctionName: functionName,
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
            Variables: Object.assign(
              {},
              ignoreGlobs,
              this.replication.s3Service.buildBucketReplicationMap()
            ),
          },
        });

        return this._lambda.updateFunctionConfiguration(functionCfg).promise().then(() => functionCfg);
      });
    }));
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
          Variables: this.replication.dynamoDbService.buildTableReplicationMap(),
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
   * @returns {String}
   */
  get s3ReplicationFunctionName() {
    return this.blueConfig().names['deep-blue-green']['replication-s3-notification'];
  }

  /**
   * @returns {String}
   */
  get s3BackFillFunctionName() {
    return this.blueConfig().names['deep-blue-green']['replication-s3-backfill'];
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

  /**
   * @param {String} lambdaArn
   * @param {String} s3BucketName
   * @returns {Promise}
   */
  addS3InvokePermission(lambdaArn, s3BucketName) {
    let payload =  {
      Action: 'lambda:InvokeFunction',
      Principal: Core.AWS.Service.identifier(Core.AWS.Service.SIMPLE_STORAGE_SERVICE),
      FunctionName: lambdaArn,
      StatementId: `Replicate_${this.replication.hashCode}_${s3BucketName.replace(/[^\w\d]/g, '-')}`,
      SourceArn: `arn:aws:s3:::${s3BucketName}`,
    };

    return this._lambda.addPermission(payload).promise().catch(e => {
      if (this._isFalsePositive(e)) {
        return Promise.resolve({});
      }

      throw e;
    });
  }

  /**
   * @param {String} functionName
   * @returns {String}
   */
  generateLambdaArn(functionName) {
    let config = this.replication.blueConfig;
    let region = config.aws.region;
    let awsAccountId = config.awsAccountId;

    return `arn:aws:lambda:${region}:${awsAccountId}:function:${functionName}`;
  }
}
