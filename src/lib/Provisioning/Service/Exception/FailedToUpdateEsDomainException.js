/**
 * Created by mgoria on 02/29/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when ES domain update failed
 */
export class FailedToUpdateEsDomainException extends Exception {
  /**
   * @param {String} domainName
   * @param {String} error
   */
  constructor(domainName, error) {
    super(`Error on updating "${domainName}" Elasticsearch domain. ${error}`);
  }
}
