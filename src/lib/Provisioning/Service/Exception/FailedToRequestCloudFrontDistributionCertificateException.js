/**
 * Created by AlexanderC on 9/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToRequestCloudFrontDistributionCertificateException extends Exception {
  /**
   * @param {String} error
   */
  constructor(error) {
    super(`Failed to request CloudFront distribution certificate using ACM: ${error}`);
  }
}
