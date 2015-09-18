/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when put API Gateway integration response failed
 */
export class FailedToPutApiGatewayIntegrationResponseException extends Exception {
  /**
   * @param {String} resourcePath
   * @param {String} error
   */
  constructor(resourcePath, error) {
    super(`Error on putting integration response for "${resourcePath}" resource. ${error}`);
  }
}
