/**
 * Created by mgoria on 03/25/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when OpenID Connect Identity Provider creation failed
 */
export class FailedToCreateOIDCException extends Exception {
  /**
   * @param {Object} IdPConfig
   * @param {String} error
   */
  constructor(IdPConfig, error) {
    super(`Error on creating an OpenID Connect Identity Provider with "${JSON.stringify(IdPConfig)}" params. ${error}`);
  }
}
