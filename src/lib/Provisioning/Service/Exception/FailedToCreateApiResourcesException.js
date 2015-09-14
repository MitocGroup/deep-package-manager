/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway creation failed
 */
export class FailedToCreateApiResourcesException extends Exception {
  /**
   * @param {Array} apiResources
   * @param {String} error
   */
  constructor(apiResources, error) {
    super(`Error on creating "${apiResources.join(', ')}" api resources. ${error}`);
  }
}
