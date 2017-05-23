/**
 * Created by CCristi on 6/28/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {CognitoIdentityProviderService} from '../Service/CognitoIdentityProviderService';

export class CognitoIdentityProviderDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return CognitoIdentityProviderService.AVAILABLE_REGIONS;
  }

  /**
   * @param {Function} cb
   * @param {String} pageToken
   */
  list(cb, pageToken = null) {
    let payload = {
      MaxResults: CognitoIdentityProviderDriver.MAX_RESULT,
    };

    if (pageToken) {
      payload.NextToken = pageToken;
    }

    this._awsService.listUserPools(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      data.UserPools.forEach(poolObj => {
        this._checkPushStack(poolObj.Name, poolObj.Id, poolObj);
      });

      if (data.NextToken) {
        this.list(cb, data.NextToken);
      } else {
        cb(null);
      }
    })
  }

  /**
   * @returns {Number}
   */
  static get MAX_RESULT() {
    return 60;
  }
}

