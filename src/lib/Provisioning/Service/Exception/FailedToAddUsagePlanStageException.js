/**
 * Created by mgoria on 02/02/17.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to add new stage to an usage plan
 */
export class FailedToAddUsagePlanStageException extends Exception {
  /**
   * @param {String} planId
   * @param {String} stageName
   * @param {String} error
   */
  constructor(planId, stageName, error) {
    super(`Error adding "${stageName}" stage to "${planId}" usage plan. ${error}`);
  }
}
