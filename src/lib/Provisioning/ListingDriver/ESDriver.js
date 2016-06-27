/**
 * Created by mgoria on 03/01/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class ESDriver extends AbstractDriver {
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
    this.awsService.listDomainNames((error, data) => {
      if (error) {
        cb(error);
        return;
      }

      data.DomainNames = data.DomainNames.map(a => a.DomainName);

      this.awsService.describeElasticsearchDomains(data, (error, data) => {
        if (error) {
          cb(error);
          return;
        }

        for (let i in data.DomainStatusList) {
          if (!data.DomainStatusList.hasOwnProperty(i)) {
            continue;
          }

          let domainData = data.DomainStatusList[i];
          let domainName = domainData.DomainName;

          this._checkPushStack(domainName, domainName, domainData);
        }

        cb(null);
      });
    });
  }
}
