/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {S3Service} from '../Service/S3Service';

export class S3Driver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return S3Service.AVAILABLE_REGIONS;
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    this._awsService.listBuckets((error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.Buckets) {
        if (!data.Buckets.hasOwnProperty(i)) {
          continue;
        }

        let bucketData = data.Buckets[i];
        let bucketName = bucketData.Name;

        this._checkPushStack(bucketName, bucketName, bucketData);
      }

      cb(null);
    });
  }
}
