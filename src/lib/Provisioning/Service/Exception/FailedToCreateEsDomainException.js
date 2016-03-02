/**
 * Created by mgoria on 02/29/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when ES domain creation failed
 */
export class FailedToCreateEsDomainException extends Exception {
  /**
   * @param {String} domainName
   * @param {String} error
   */
  constructor(domainName, error) {
    super(`Error on creating "${domainName}" Elasticsearch domain. ${error}`);
  }
}
