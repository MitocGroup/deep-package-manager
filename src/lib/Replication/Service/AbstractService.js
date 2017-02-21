/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import Core from 'deep-core';

export class AbstractService extends Core.OOP.Interface {
  /**
   * @param {Instance} replicationInstance
   */
  constructor(replicationInstance) {
    super(['name']);

    this._replication = replicationInstance;
  }

  /**
   * @returns {Instance}
   */
  get replication() {
    return this._replication;
  }

  /**
   * @returns {Object}
   */
  blueConfig() {
    return this.replication.blueConfig.provisioning[this.name()];
  }

  /**
   * @returns {Object}
   */
  greenConfig() {
    return this.replication.greenConfig.provisioning[this.name()];
  }

  /**
   * @param {AWS.Request|Object} request
   * @param {String[]} retryableCodes
   * @returns {AWS.Request|Object}
   */
  _retryableRequest(request, retryableCodes = []) {
    retryableCodes = retryableCodes
      .filter(c => AbstractService._safeRetryableCodes.indexOf(c) === -1)
      .concat(AbstractService._safeRetryableCodes);

    request.on('retry', response => {
      if (retryableCodes.indexOf(response.error.code) !== -1) {
        console.warn(`"${this.name()}" resources locked. Retrying...`);

        response.error.retryable = true;
        response.error.retryDelay = AbstractService.RETRY_DELAY;
        response.error.retryCount = AbstractService.RETRY_COUNT;
      }
    });

    return request;
  }

  /**
   * @returns {String[]}
   */
  static get _safeRetryableCodes() {
    return ['ResourceInUseException', 'Throttling'];
  }

  /**
   * @returns {Number}
   */
  static get RETRY_COUNT() {
    return 5;
  }

  /**
   * @returns {Number}
   */
  static get RETRY_DELAY() {
    return 5000;
  }
}
