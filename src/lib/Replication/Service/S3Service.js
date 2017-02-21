/**
 * Created by CCristi on 2/17/17.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';

export class S3Service extends AbstractService {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._s3 = null;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
  }

  /**
   * @param {Object} s3
   */
  set s3(s3) {
    this._s3 = s3;
  }

  /**
   * @param {String} bucketName
   * @returns {Promise}
   */
  addReplicationLambdaNotification(bucketName) {
    let lambdaService = this.replication.lambdaService;
    let s3ReplicationFuncName = lambdaService.s3ReplicationFunctionName;

    let payload = {
      Bucket: bucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
          {
            Id: `Replication_${this.replication.hashCode}_${bucketName}`,
            Events: [
              's3:ObjectCreated:Put',
              's3:ObjectCreated:Post',
              's3:ObjectRemoved:Delete',
            ],
            LambdaFunctionArn: lambdaService.generateLambdaArn(s3ReplicationFuncName),
          },
        ],
      },
    };

    return this._s3.putBucketNotificationConfiguration(payload).promise();
  }

  /**
   * @param {String} bucketName
   * @returns {Promise}
   */
  removeBucketReplicationNotification(bucketName) {
    let lambdaService = this.replication.lambdaService;
    let s3ReplicationFuncArn = lambdaService.generateLambdaArn(lambdaService.s3ReplicationFunctionName);

    return this._s3.getBucketNotificationConfiguration({
      Bucket: bucketName
    }).promise().then(configurationObj => {
      let updatePayload = Object.assign({Bucket: bucketName,}, configurationObj);

      updatePayload.LambdaFunctionConfigurations = updatePayload.LambdaFunctionConfigurations.filter(lambdaCfg => {
        return lambdaCfg.LambdaFunctionArn !== s3ReplicationFuncArn;
      });

      return this._s3.putBucketNotificationConfiguration(updatePayload).promise();
    });
  }

  /**
   * @returns {Object}
   */
  buildBucketReplicationMap() {
    let replMap = {};
    let blueBuckets = this.blueConfig().buckets;
    let greenBuckets = this.greenConfig().buckets;

    for (let type in blueBuckets) {
      if (!blueBuckets.hasOwnProperty(type)) {
        continue;
      }

      let blueAwsName = blueBuckets[type].name;
      let greenAwsName = greenBuckets[type].name;

      replMap[blueAwsName.replace(/\./g, '_')] = greenAwsName;
      replMap[greenAwsName.replace(/\./g, '_')] = blueAwsName;
    }

    return replMap;
  }
}
