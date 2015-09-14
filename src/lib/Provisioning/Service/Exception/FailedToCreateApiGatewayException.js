/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway creation failed
 */
export class FailedToCreateApiGatewayException extends Exception {
  /**
   * @param {String} apiName
   * @param {String} error
   */
  constructor(apiName, error) {
    super(`Error on creating "${apiName}" api gateway. ${error}`);
  }
}
