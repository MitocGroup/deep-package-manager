/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when put API Gateway method failed
 */
export class FailedToPutApiGatewayMethodException extends Exception {
  /**
   * @param {String} resourcePath
   * @param {String} httpMethod
   * @param {String} error
   */
  constructor(resourcePath, httpMethod, error) {
    super(`Error on putting "${httpMethod}" method on "${resourcePath}" resource. ${error}`);
  }
}
