/**
 * Created by mgoria on 6/8/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when iam access policy creation failed
 */
export class FailedToCreateAccessPolicyException extends Exception {
    /**
     * @param {String} policyName
     * @param {String} error
     */
  constructor(policyName, error) {
    super(`Error on creating "${policyName}" access policy. ${error}`);
  }
}
