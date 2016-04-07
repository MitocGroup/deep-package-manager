/**
 * Created by mgoria on 04/07/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to add a new clientId to an OpenID Connect Identity Provider
 */
export class FailedToAddClientIdToOIDCProviderException extends Exception {
  /**
   * @param {String} clientId
   * @param {String} identityProviderARN
   * @param {String} error
   */
  constructor(clientId, identityProviderARN, error) {
    super(`Error on adding "${clientId}" clientId to "${identityProviderARN}" OIDC Provider. ${error}`);
  }
}
