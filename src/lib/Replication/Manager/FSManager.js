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
   */
  prepare(ignoreGlobs) {
    return this.lambdaService.injectEnvVarsIntoS3ReplicationLambda(ignoreGlobs).then(() => {
      let buckets = this.s3Service.blueConfig().buckets;

      return this._enableFsReplicationTriggers(buckets);
    });
  }

  /**
   * @param {Object} buckets
   * @returns {Promise}
   * @private
   */
  _enableFsReplicationTriggers(buckets) {
    let preparePromises = [];

    for (let type in buckets) {
      if (!buckets.hasOwnProperty(type)) {
        continue;
      }

      let bucketAwsName = buckets[type].name;
      let promise = this.lambdaService
        .addS3InvokePermission(
          this.lambdaService.s3ReplicationFunctionName,
          bucketAwsName
        )
        .then(() => this.wait(10000)) // lambda permissions are propagated slowly
        .then(() => {
          return this.s3Service.addReplicationLambdaNotification(bucketAwsName);
        });

      preparePromises.push(promise);
    }

    return Promise.all(preparePromises);
  }

  /**
   * @returns {Promise}
   */
  start() {
    let buckets = this.s3Service.greenConfig().buckets;

    return this._enableFsReplicationTriggers(buckets);
  }

  /**
   * @returns {Promise}
   */
  stop() {
    return Promise.resolve();
  }
}
