/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {CognitoIdentityService} from '../Service/CognitoIdentityService';

export class CognitoIdentityDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return CognitoIdentityService.AVAILABLE_REGIONS;
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    this._awsService.listIdentityPools({
      MaxResults: CognitoIdentityDriver.MAX_RESULTS,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.IdentityPools) {
        if (!data.IdentityPools.hasOwnProperty(i)) {
          continue;
        }

        let identityPoolData = data.IdentityPools[i];
        let identityPoolId = identityPoolData.IdentityPoolId;
        let identityPoolName = identityPoolData.IdentityPoolName;

        this._checkPushStack(identityPoolName, identityPoolId, identityPoolData);
      }

      cb(null);
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_RESULTS() {
    return 60;
  }
}
