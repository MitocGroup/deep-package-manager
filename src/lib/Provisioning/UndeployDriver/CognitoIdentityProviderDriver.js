/**
 * Created by CCristi on 6/28/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CognitoIdentityProviderDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  service() {
    return 'CognitoIdentityProvider';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this.awsService.deleteUserPool({
      UserPoolId: resourceId,
    }, cb);
  }
}
