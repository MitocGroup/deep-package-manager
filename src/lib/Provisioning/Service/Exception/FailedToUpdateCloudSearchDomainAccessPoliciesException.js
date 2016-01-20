/**
 * Created by AlexanderC on 9/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToUpdateCloudSearchDomainAccessPoliciesException extends Exception {
  /**
   * @param {String} error
   */
  constructor(error) {
    super(`Failed to update CloudSearch domain access policies: ${error}`);
  }
}
