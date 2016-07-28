/**
 * Created by mgoria on 6/8/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to set IAM roles for auth and unauth users to Cognito identity pool
 */
export class FailedSettingIdentityPoolRolesException extends Exception {
    /**
     * @param {String} identityPoolName
     * @param {String} error
     */
  constructor(identityPoolName, error) {
    super(`Error on setting auth and unauth roles to "${identityPoolName}" identity pool. ${error}`);
  }
}
