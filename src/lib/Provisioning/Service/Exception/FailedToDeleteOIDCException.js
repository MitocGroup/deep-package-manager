/**
 * Created by mgoria on 03/28/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when OpenID Connect Identity Provider deletion failed
 */
export class FailedToDeleteOIDCException extends Exception {
  /**
   * @param {String} identityProviderARN
   * @param {String} error
   */
  constructor(identityProviderARN, error) {
    super(`Error on deleting "${identityProviderARN}" OpenID Connect Identity Provider. ${error}`);
  }
}
