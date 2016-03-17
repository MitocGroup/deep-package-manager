/**
 * Created by mgoria on 03/11/16.
 */

'use strict';

import Core from 'deep-core';
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
  describe(cb) {
    this._describeEsDomains(
      this._getProvisionedDomains(),
      cb
    );
  }

  /**
   * @param {Array} domainNames
   * @param {Function} callback
   * @private
   */
  _describeEsDomains(domainNames, callback) {
    if (domainNames.length === 0) {
      callback(null);
      return;
    }

    this.awsService.describeElasticsearchDomains({DomainNames: domainNames}, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      let domains = data.DomainStatusList || [];

      domains.forEach((domain) => {
        this._pushInStack(domain.DomainName, domain || null);
      });

      callback(null);
    });
  }

  /**
   * @returns {Array}
   * @private
   */
  _getProvisionedDomains() {
    let domainNames = [];

    if (this._appConfig && this._appConfig.searchDomains) {
      let domains = this._appConfig.searchDomains;

      for (let i in domains) {
        if (!domains.hasOwnProperty(i)) {
          continue;
        }

        let domain = domains[i];

        if (domain.type === Core.AWS.Service.ELASTIC_SEARCH) {
          domainNames.push(domain.name);
        }
      }
    }

    return domainNames;
  }
}
