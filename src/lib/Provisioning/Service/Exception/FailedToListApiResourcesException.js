/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when list API Gateway resource failed
 */
export class FailedToListApiResourcesException extends Exception {
  /**
   * @param {String} apiId
   * @param {String} error
   */
  constructor(apiId, error) {
    super(`Error on listing resources for "${apiId}" api. ${error}`);
  }
}
