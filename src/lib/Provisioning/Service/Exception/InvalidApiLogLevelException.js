/**
 * Created by mgoria on 18/02/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when an invalid CloudWatch log level is set for API Gateway
 */
export class InvalidApiLogLevelException extends Exception {
  /**
   * @param {String} level
   * @param {Array} availableLevels
   */
  constructor(level, availableLevels) {
    super(`Invalid API Gateway log level "${level}". Available levels "${availableLevels.join(', ')}".`);
  }
}
