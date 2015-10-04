/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to deploy an API Gateway
 */
export class FailedToDeployApiGatewayException extends Exception {
  /**
   * @param {String} apiId
   * @param {String} error
   */
  constructor(apiId, error) {
    super(`Error on deploying API "${apiId}". ${error}`);
  }
}
