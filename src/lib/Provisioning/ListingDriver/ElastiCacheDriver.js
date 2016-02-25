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
   * @param {Function} cb
   */
  list(cb) {
    this._listClusters(cb);
  }

  /**
   * @param {Function} cb
   * @param {String|null} nextMarker
   * @private
   */
  _listClusters(cb, nextMarker = null) {
    let payload = {
      MaxRecords: ElastiCacheDriver.MAX_RECORDS,
      ShowCacheNodeInfo: false,
    };

    if (nextMarker) {
      payload.Marker = nextMarker;
    }

    this._awsService.describeCacheClusters(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.CacheClusters) {
        if (!data.CacheClusters.hasOwnProperty(i)) {
          continue;
        }

        let clusterData = data.CacheClusters[i];
        let clusterId = clusterData.CacheClusterId;

        this._checkPushStack(clusterId, clusterId, clusterData);
      }

      if (data.Marker) {
        this._listClusters(cb, data.Marker);
      } else {
        cb(null);
      }
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_RECORDS() {
    return 100;
  }
}
