/**
 * Created by mgoria on 01/02/17.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway usage plan creation failed
 */
export class FailedToCreateUsagePlanException extends Exception {
  /**
   * @param {String} planName
   * @param {String} error
   */
  constructor(planName, error) {
    super(`Error creating "${planName}" api gateway usage plan. ${error}`);
  }
}
