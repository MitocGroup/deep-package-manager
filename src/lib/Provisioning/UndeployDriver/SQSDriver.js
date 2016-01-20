/**
 * Created by mgoria on 01/19/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class SQSDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  service() {
    return 'SQS';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeQueue(resourceId, cb);
  }

  /**
   * @param {String} queueUrl
   * @param {Function} cb
   * @private
   */
  _removeQueue(queueUrl, cb) {
    this.awsService.deleteQueue({
      QueueUrl: queueUrl,
    }, (error) => {
      cb(error);
    });
  }
}
