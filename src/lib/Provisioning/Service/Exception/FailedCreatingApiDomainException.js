/**
 * Created by mgoria on 6/8/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedCreatingApiDomainException extends Exception {
    /**
     * @param {String} domainName
     * @param {String} certificateArn
     */
  constructor(domainName, certificateArn) {
    super(`Failed creating custom Api domain '${domainName}' using certificate '${certificateArn}'`);
  }
}
