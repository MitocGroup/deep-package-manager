/**
 * Created by mgoria on 18/02/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to update an API Gateway account
 */
export class FailedToUpdateApiGatewayAccountException extends Exception {
  /**
   * @param {String} region
   * @param {Object} params
   * @param {String} error
   */
  constructor(region, params, error) {
    super(`Error on updating API Gateway account in "${region}" region with ${JSON.stringify(params)} request params. ${error}`);
  }
}
