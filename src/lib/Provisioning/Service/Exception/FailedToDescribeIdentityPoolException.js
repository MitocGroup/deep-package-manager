/**
 * Created by CCristi on 2/27/17.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when identity pool describe failed
 */
export class FailedToDescribeIdentityPoolException extends Exception {
  /**
   * @param {String} poolId
   * @param {String} error
   */
  constructor(poolId, error) {
    super(`Error on describing "${poolId}" cognito identity pool. ${error}: ${error.stack}`);
  }
}
