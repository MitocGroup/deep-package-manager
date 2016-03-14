/**
 * Created by mgoria on 03/11/16.
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
  describe(cb) {
    let responses = 0;
    let domains = this._getProvisionedDomains();

    if (domains.length === 0) {
      cb(null);
      return;
    }

    domains.forEach((domainName) => {
      this._describeEsDomain(domainName, (result) => {
        responses++;
        if (responses === domains.length) {
          cb(result);
        }
      });
    });
  }

  /**
   * @param {String} domainName
   * @param {Function} callback
   * @private
   */
  _describeEsDomain(domainName, callback) {
    this.awsService.describeElasticsearchDomain({DomainName: domainName}, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      this._pushInStack(domainName, data.DomainStatus || null);
    });
  }

  /**
   * @returns {Array}
   * @private
   */
  _getProvisionedDomains() {
    let domainNames = [];

    if (this._deployCfg && this._deployCfg.es && this._deployCfg.es.domains) {
      let domains = this._deployCfg.es.domains;

      for (let i in domains) {
        if (!domains.hasOwnProperty(i)) {
          continue;
        }

        domainNames.push(domains[i].DomainName);
      }
    }

    return domainNames;
  }
}
