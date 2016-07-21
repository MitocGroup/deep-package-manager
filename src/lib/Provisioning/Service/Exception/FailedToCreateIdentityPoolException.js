/**
 * Created by mgoria on 5/25/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when identity pool creation failed
 */
export class FailedToCreateIdentityPoolException extends Exception {
    /**
     * @param {String} poolName
     * @param {String} error
     */
  constructor(poolName, error) {
    super(`Error on creating "${poolName}" cognito identity pool. ${error}`);
  }
}
