/**
 * Created by mgoria on 04/07/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to get OpenID Connect Identity Provider
 */
export class FailedToGetOIDCProviderException extends Exception {
  /**
   * @param {String} identityProviderARN
   * @param {String} error
   */
  constructor(identityProviderARN, error) {
    super(`Error on getting "${identityProviderARN}" OpenID Connect Identity Provider. ${error}`);
  }
}
