/**
 * Created by CCristi on 8/8/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class MissingPolicyProviderMethodException extends Exception {
  /**
   * @param {String} cognitoRole
   */
  constructor(cognitoRole) {
    super(`Missing policy provider method for "${cognitoRole}" role`);
  }
}
