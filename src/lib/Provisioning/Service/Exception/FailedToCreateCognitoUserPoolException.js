/**
 * Created by CCristi on 6/27/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToCreateCognitoUserPoolException extends Exception {
  /**
   * @param {String} poolName
   * @param {String} error
   */
  constructor(poolName, error) {
    super(`Error on creating cognito user pool "${poolName}": ${error}`);
  }
}