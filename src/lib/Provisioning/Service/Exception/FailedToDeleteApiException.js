/**
 * Created by mgoria on 03/02/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to delete an API Gateway instance
 */
export class FailedToDeleteApiException extends Exception {
  /**
   * @param {String} apiId
   * @param {String} error
   */
  constructor(apiId, error) {
    super(`Error on deleting "${apiId}" API. ${error}`);
  }
}
