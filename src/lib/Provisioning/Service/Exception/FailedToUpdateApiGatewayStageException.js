/**
 * Created by mgoria on 16/12/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to update an API Gateway stage
 */
export class FailedToUpdateApiGatewayStageException extends Exception {
  /**
   * @param {String} apiId
   * @param {String} stageName
   * @param {String} error
   */
  constructor(apiId, stageName, error) {
    super(`Error on updating API "${apiId}" stage "${stageName}". ${error}`);
  }
}
