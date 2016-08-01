/**
 * Created by CCristi on 13/7/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToCreateAdminUserException extends Exception {
  /**
   * @param {String} error
   */
  constructor(error) {
    super(`Error on creating admin user: ${error}`);
  }
}
