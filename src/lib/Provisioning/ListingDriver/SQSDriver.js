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
   * @param {Function} cb
   */
  list(cb) {
    this.awsService.listQueues({
      QueueNamePrefix: SQSDriver.QUEUE_NAME_PREFIX,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.QueueUrls) {
        if (!data.QueueUrls.hasOwnProperty(i)) {
          continue;
        }

        let queueUrl = data.QueueUrls[i];
        let queueName = queueUrl.replace(/\/+$/g, '').split('/').pop();

        this._checkPushStack(queueName, queueUrl, queueUrl);
      }

      cb(null);
    });
  }

  /**
   * @returns {Number}
   */
  static get QUEUE_NAME_PREFIX() {
    return 'Deep';
  }
}
