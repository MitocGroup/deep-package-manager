/**
 * Created by AlexanderC on 9/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToCreateCloudFrontDistributionException extends Exception {
  /**
   * @param {String} error
   */
  constructor(error) {
    super(`Failed to create CloudFront distribution: ${error}`);
  }
}
