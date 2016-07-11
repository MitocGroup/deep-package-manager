/**
 * Created by CCristi on 7/11/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when identity pool update failed
 */
export class FailedToUpdateUserPoolException extends Exception {
  /**
   * @param {String} poolName
   * @param {String} error
   */
  constructor(poolName, error) {
    super(`Error on updating "${poolName}" cognito user pool. ${error}`);
  }
}
