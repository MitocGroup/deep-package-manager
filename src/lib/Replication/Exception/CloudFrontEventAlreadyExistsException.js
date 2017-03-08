/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class CloudFrontEventAlreadyExistsException extends Exception {
  /**
   * @param {String} eventType
   * @param {String} distributionId
   * @param {String} lambdaArn
   */
  constructor(eventType, distributionId, lambdaArn) {
    super(`CloudFront distribution "${distributionId}" has already a lambda attached to "${eventType}": ${lambdaArn}.`);
  }
}
