/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class ElastiCacheDriver extends AbstractDriver {
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
    return 'ElastiCache';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._awsService.deleteCacheCluster({CacheClusterId: resourceId,}, (error) => {
      cb(error);
    });
  }
}
