/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway resource creation failed
 */
export class FailedToCreateApiResourceException extends Exception {
  /**
   * @param {String} pathPart
   * @param {String} error
   */
  constructor(pathPart, error) {
    super(`Error on creating "${pathPart}" api resource. ${error}`);
  }
}
