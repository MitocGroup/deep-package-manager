/**
 * Created by CCristi on 02/28/17.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway usage plan creation failed
 */
export class FailedToRetrieveUsagePlanException extends Exception {
  /**
   * @param {String} planId
   * @param {String} error
   */
  constructor(planId, error) {
    super(`Error retrieving "${planId}" api gateway usage plan. ${error}`);
  }
}
