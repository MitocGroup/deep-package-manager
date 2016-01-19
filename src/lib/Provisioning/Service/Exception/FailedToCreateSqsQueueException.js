/**
 * Created by mgoria on 01/19/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when sqs queue creation failed
 */
export class FailedToCreateSqsQueueException extends Exception {
  /**
   * @param {String} queueName
   * @param {String} error
   */
  constructor(queueName, error) {
    super(`Error on creating "${queueName}" SQS queue. ${error}`);
  }
}
