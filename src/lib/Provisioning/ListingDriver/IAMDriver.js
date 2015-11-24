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
   * @returns {Number}
   */
  static get MAX_ITEMS() {
    return 1000;
  }
}
