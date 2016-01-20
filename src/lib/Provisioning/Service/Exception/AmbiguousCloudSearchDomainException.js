/**
 * Created by AlexanderC on 9/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class AmbiguousCloudSearchDomainException extends Exception {
  /**
   * @param {String} microserviceIdentifier
   * @param {String} domainName
   */
  constructor(microserviceIdentifier, domainName) {
    super(`Ambiguous CloudSearch domain name '${domainName}' in microservice '${microserviceIdentifier}'`);
  }
}
