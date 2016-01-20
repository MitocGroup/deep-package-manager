/**
 * Created by AlexanderC on 6/16/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToRunCloudSearchDocumentsIndexingException extends Exception {
  /**
   * @param {String} domainName
   * @param {String} error
   */
  constructor(domainName, error) {
    super(`Failed to run index documents for CloudFront domain "${domainName}". ${error}`);
  }
}
