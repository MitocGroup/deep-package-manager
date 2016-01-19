/**
 * Created by mgoria on 01/19/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {AbstractService} from '../Service/AbstractService';

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
      QueueNamePrefix: AbstractService.AWS_RESOURCES_PREFIX,
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

        this._checkPushStack(queueUrl, queueUrl);
      }

      cb(null);
    });
  }
}
