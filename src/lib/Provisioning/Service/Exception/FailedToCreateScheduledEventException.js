/**
 * Created by AlexanderC on 3/3/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToCreateScheduledEventException extends Exception {
  /**
   * @param {String} lambdaName
   * @param {Error|String} error
   */
  constructor(lambdaName, error) {
    super(`Failed to create scheduled event for lambda '${lambdaName}': ${error}`);
  }
}
