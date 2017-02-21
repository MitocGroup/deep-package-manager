/**
 * Created by CCristi on 2/17/17.
 */

'use strict';

import Core from 'deep-core';

export class AbstractManager extends Core.OOP.Interface {
  /**
   * @param {Instance} replicationInstance
   */
  constructor(replicationInstance) {
    super(['prepare', 'start', 'stop', 'name']);

    this._replication = replicationInstance;
  }

  /**
   * @returns {DynamoDBService}
   */
  get dynamoDbService() {
    return this.replication.dynamoDbService;
  }

  /**
   * @returns {LambdaService}
   */
  get lambdaService() {
    return this.replication.lambdaService;
  }

  /**
   * @returns {S3Service}
   */
  get s3Service() {
    return this.replication.s3Service;
  }

  /**
   * @returns {Instance}
   */
  get replication() {
    return this._replication;
  }

  /**
   * @returns {*|String}
   */
  get hashCode() {
    return this.replication.hashCode;
  }

  /**
   * @returns {*|AbstractService.blueConfig|Object}
   */
  get blueConfig() {
    return this.replication.blueConfig;
  }

  /**
   * @returns {Object}
   */
  get greenConfig() {
    return this.replication.greenConfig;
  }

  /**
   * @param {Number} duration
   * @returns {Promise}
   */
  wait(duration) {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }
}
