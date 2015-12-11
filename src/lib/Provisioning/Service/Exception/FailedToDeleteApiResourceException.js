/**
 * Created by mgoria on 11/12/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when API Gateway resource deletion failed
 */
export class FailedToDeleteApiResourceException extends Exception {
  /**
   * @param {String} pathPart
   * @param {String} error
   */
  constructor(pathPart, error) {
    super(`Error on deleting "${pathPart}" api resource. ${error}`);
  }
}
