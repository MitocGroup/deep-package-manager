/**
 * Created by AlexanderC on 11/26/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class MissingCredentialsException extends Exception {
  /**
   * @param {AbstractDriver|*} driver
   */
  constructor(driver) {
    super(`Missing AWS credentials for ${driver.service()}`);
  }
}
