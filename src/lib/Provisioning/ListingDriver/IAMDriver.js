/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class IAMDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    let methods = ['_listRoles', '_listOIDCProviders'];
    let responseCount = 0;
    let errors = [];

    methods.forEach((methodName) => {
      this[methodName]((error) => {
        responseCount++;

        if (error) {
          errors.push(error);
        }

        if (responseCount === methods.length) {
          cb(errors.length > 0 ? errors.join('; ') : null);
        }
      });
    });
  }

  /**
   * @param {Function} cb
   * @private
   */
  _listRoles(cb) {
    this._awsService.listRoles({
      MaxItems: IAMDriver.MAX_ITEMS,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.Roles) {
        if (!data.Roles.hasOwnProperty(i)) {
          continue;
        }

        let roleData = data.Roles[i];
        let roleName = roleData.RoleName;

        this._checkPushStack(roleName, roleName, roleData);
      }

      cb(null);
    });
  }

  /**
   * @param {Function} cb
   * @private
   */
  _listOIDCProviders(cb) {
    this._awsService.listOpenIDConnectProviders({}, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      data.OpenIDConnectProviderList.forEach((provider) => {
        let providerARN = provider.Arn;

        this._checkPushStack(providerARN, providerARN, providerARN);
      });

      cb(null);
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_ITEMS() {
    return 1000;
  }
}
