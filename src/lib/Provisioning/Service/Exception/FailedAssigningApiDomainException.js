/**
 * Created by mgoria on 6/8/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedAssigningApiDomainException extends Exception {
    /**
     * @param {String} domainName
     * @param {String} apiId
     */
  constructor(domainName, apiId) {
    super(`Failed assigning custom domain '${domainName}' to Api '${apiId}'`);
  }
}
