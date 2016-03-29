/**
 * Created by mgoria on 03/28/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when identity pool update failed
 */
export class FailedToUpdateIdentityPoolException extends Exception {
  /**
   * @param {String} poolName
   * @param {String} error
   */
  constructor(poolName, error) {
    super(`Error on updating "${poolName}" cognito identity pool. ${error}`);
  }
}