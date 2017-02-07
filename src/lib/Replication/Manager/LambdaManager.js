/**
 * Created by CCristi on 2/6/17.
 */

import {AbstractManager} from './AbstractManager';
import Core from 'deep-core';
import https from 'https';

'use strict';

export class LambdaManager extends AbstractManager {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._lambda = null;
  }

  /**
   * @param {Object} lambda
   */
  set lambda(lambda) {
    this._lambda = lambda;
  }

  /**
   * @param {String} dynamoDbStreamArn
   * @param {Number} batchSize
   * @returns {Promise}
   */
  createDynamoDBStreamTriggerFunction(dynamoDbStreamArn, batchSize = 100) {
    let lambdaConfig = this.serviceConfig(Core.AWS.Service.LAMBDA);
    let replicationTplFunction = lambdaConfig.names['deep-blue-green']['replication-stream'];

    return this._lambda.getFunction({
      FunctionName: replicationTplFunction,
    }).promise().then(functionMetadata => {
      let payload = functionMetadata.Configuration;

      delete payload.CodeSize;
      delete payload.CodeSha256;
      delete payload.KMSKeyArn;
      delete payload.FunctionArn;
      delete payload.LastModified;
      delete payload.Version;
      delete payload.VpcConfig;

      payload.FunctionName += 'test' + Date.now();
      
      return this._fetch(functionMetadata.Code.Location).then(buffer => {
        payload.Code = {
          ZipFile: buffer,
        };
        return this._lambda.createFunction(payload).promise();
      });

      
    }).then(functionObj => {
      let payload = {
        EventSourceArn: dynamoDbStreamArn,
        FunctionName: functionObj.FunctionName,
        BatchSize: batchSize,
        Enabled: true,
        StartingPosition: 'TRIM_HORIZON',
      };

      return this._lambda.createEventSourceMapping(payload).promise();
    });
  }

  /**
   * @param {String} url
   * @returns {Promise}
   */
  _fetch(url) {
    return new Promise((resolve, reject) => {
      https.get(url, response => {
        let chunks = [];

        response
          .on('data', chunk => chunks.push(chunk))
          .on('end', () => resolve(Buffer.concat(chunks)));

      }).on('error', reject);
    });
  }
}
