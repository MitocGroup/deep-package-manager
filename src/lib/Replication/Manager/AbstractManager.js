/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

export class AbstractManager {
  /**
   * @param {String} replicationInstance
   */
  constructor(replicationInstance) {
    this._replication = replicationInstance;
  }

  /**
   * @returns {Instance}
   */
  get replication() {
    return this._replication;
  }

  /**
   * @returns {*}
   */
  get config() {
    return this.replication.config;
  }

  /**
   * @param {String} awsServiceName
   * @returns {Object}
   */
  serviceConfig(awsServiceName) {
    return this.config.provisioning[awsServiceName];
  }
}
