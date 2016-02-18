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
   * @param {String} error
   */
  constructor(region, error) {
    super(`Error on updating API Gateway account for "${region}" region. ${error}`);
  }
}
