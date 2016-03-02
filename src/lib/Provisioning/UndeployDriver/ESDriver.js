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
   * @returns {String}
   */
  service() {
    return 'ES';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeDomain(resourceId, cb);
  }

  /**
   * @param {String} domainName
   * @param {Function} cb
   * @private
   */
  _removeDomain(domainName, cb) {
    this.awsService.deleteElasticsearchDomain({
      DomainName: domainName,
    }, (error) => {
      cb(error);
    });
  }
}
