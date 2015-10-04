/**
 * Created by mgoria on 6/5/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when iam role creation failed
 */
export class FailedToCreateIamRoleException extends Exception {
  /**
   * @param {String} roleName
   * @param {String} error
   */
  constructor(roleName, error) {
    super(`Error on creating "${roleName}" role. ${error}`);
  }
}
