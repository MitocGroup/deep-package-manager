/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when put API Gateway integration failed
 */
export class FailedToPutApiGatewayIntegrationException extends Exception {
  /**
   * @param {String} resourcePath
   * @param {String} backendUri
   * @param {String} error
   */
  constructor(resourcePath, backendUri, error) {
    super(`Error on integrating "${resourcePath}" resource with ${backendUri} uri. ${error}`);
  }
}
