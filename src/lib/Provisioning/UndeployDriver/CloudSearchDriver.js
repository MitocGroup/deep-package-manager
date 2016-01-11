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
   * @returns {String}
   */
  service() {
    return 'CloudSearch';
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
   * @param {Number} retries
   * @private
   */
  _removeDomain(domainName, cb, retries = 0) {
    this._awsService.deleteDomain({
      DomainName: domainName,
    }, (error) => {
      if (error) {
        cb(error);
        return;
      }

      cb(null);
    });
  }
}
