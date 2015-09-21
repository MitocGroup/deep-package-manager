/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when put API Gateway method response failed
 */
export class FailedToPutApiGatewayMethodResponseException extends Exception {
  /**
   * @param {String} resourcePath
   * @param {String} httpMethod
   * @param {String} error
   */
  constructor(resourcePath, httpMethod, error) {
    super(`Error on putting "${httpMethod}" method response for "${resourcePath}" resource. ${error}`);
  }
}
