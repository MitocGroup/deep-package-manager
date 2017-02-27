/**
 * Created by CCristi on 2/17/17.
 */

'use strict';

import {AbstractManager} from './AbstractManager';

export class FSManager extends AbstractManager {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return 'FS';
  }

  /**
   * @param {{privateIgnoreGlob: String, publicIgnoreGlob: String}} ignoreGlobs
   * @returns {Promise}
   */
  prepare(ignoreGlobs) {
    let buckets = this.s3Service.blueConfig().buckets;
    let plainBuckets = this._plainifyBucketsObj(buckets);

    return this.lambdaService.injectEnvVarsIntoS3ReplicationLambdas(ignoreGlobs).then(() => {
      return this._enableFsReplicationTriggers(plainBuckets);
    }).then(() => {
      return Promise.all(plainBuckets.map(bucket => this.lambdaService.startS3BackFillLambda(bucket)));
    });
  }

  /**
   * @param {Array} bucketsArray
   * @returns {Promise}
   * @private
   */
  _enableFsReplicationTriggers(bucketsArray) {
    if (bucketsArray.length === 0) {
      return Promise.resolve();
    }

    let bucketsClone = [].concat(bucketsArray);
    let currentBucket = bucketsClone.shift();

    return this.lambdaService
      .addS3InvokePermission(
        this.lambdaService.s3ReplicationFunctionName,
        currentBucket
      )
      .then(() => this.wait(5000)) // lambda permissions are propagated slowly
      .then(() => this.s3Service.addReplicationLambdaNotification(currentBucket))
      .then(() => this._enableFsReplicationTriggers(bucketsClone))
      .then(() => {
        console.debug(`Replication triggers have been enabled for "${currentBucket}" bucket.`);
      });
  }

  /**
   * @param {Object} buckets
   * @returns {Promise}
   * @private
   */
  _disableFsReplication(buckets) {
    let disablePromises = [];

    for (let type in buckets) {
      if (!buckets.hasOwnProperty(type)) {
        continue;
      }

      let bucketAwsName = buckets[type].name;
      let promise = this.s3Service.removeBucketReplicationNotification(bucketAwsName);

      disablePromises.push(promise);
    }

    return Promise.all(disablePromises);
  }

  /**
   * @returns {Promise}
   */
  start() {
    let buckets = this.s3Service.greenConfig().buckets;

    return this._enableFsReplicationTriggers(this._plainifyBucketsObj(buckets));
  }

  /**
   * @param {Object} buckets
   * @returns {Array}
   * @private
   */
  _plainifyBucketsObj(buckets) {
    let plainBuckets = [];

    for (let type in buckets) {
      if (!buckets.hasOwnProperty(type)) {
        continue;
      }

      let bucketAwsName = buckets[type].name;

      plainBuckets.push(bucketAwsName);
    }

    return plainBuckets;
  }

  /**
   * @returns {Promise}
   */
  stop() {
    let blueBuckets = this.s3Service.blueConfig().buckets;
    let greenBuckets = this.s3Service.greenConfig().buckets;

    return Promise.all([
      this._disableFsReplication(blueBuckets),
      this._disableFsReplication(greenBuckets),
    ]);
  }
}
