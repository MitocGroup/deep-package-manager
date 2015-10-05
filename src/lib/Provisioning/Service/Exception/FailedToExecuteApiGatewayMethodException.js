/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to execute an API Gateway method (e.g. putMethod, putIntegration, etc.)
 */
export class FailedToExecuteApiGatewayMethodException extends Exception {
  /**
   * @param {String} method
   * @param {String} resourcePath
   * @param {String} httpMethod
   * @param {String} error
   */
  constructor(method, resourcePath, httpMethod, error) {
    super(`Error on executing API Gateway "${method}" with "${httpMethod}" method and "${resourcePath}" resource. ${error}`);
  }
}
