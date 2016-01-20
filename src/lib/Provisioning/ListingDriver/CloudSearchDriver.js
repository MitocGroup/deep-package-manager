/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CloudSearchDriver extends AbstractDriver {
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
    this._awsService.describeDomains({}, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.DomainStatusList) {
        if (!data.DomainStatusList.hasOwnProperty(i)) {
          continue;
        }

        let domainInfo = data.DomainStatusList[i];

        this._checkPushStack(domainInfo.DomainName, domainInfo.DomainName);
      }

      cb(null);
    });
  }
}
