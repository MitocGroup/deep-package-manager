/**
 * Created by mgoria on 26/01/17.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway Authorizer creation failed
 */
export class FailedToCreateApiAuthorizerException extends Exception {
  /**
   * @param {String} authorizerName
   * @param {String} error
   */
  constructor(authorizerName, error) {
    super(`Error creating "${authorizerName}" api gateway authorizer. ${error}`);
  }
}
