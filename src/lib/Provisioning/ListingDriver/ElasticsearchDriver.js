/**
 * Created by mgoria on 03/01/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class ElasticsearchDriver extends AbstractDriver {
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

      for (let i in data.DomainNames) {
        if (!data.DomainNames.hasOwnProperty(i)) {
          continue;
        }

        let domainName = data.DomainNames[i].DomainName;

        this._checkPushStack(domainName, domainName);
      }

      cb(null);
    });
  }
}
