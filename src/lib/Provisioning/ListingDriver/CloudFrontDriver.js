/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CloudFrontDriver extends AbstractDriver {
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
    this._listDistributions(cb);
  }

  /**
   * @param {Function} cb
   * @param {String|null} nextMarker
   * @private
   */
  _listDistributions(cb, nextMarker = null) {
    let payload = {
      MaxItems: CloudFrontDriver.MAX_ITEMS,
    };

    if (nextMarker) {
      payload.Marker = nextMarker;
    }

    this._awsService.listDistributions(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.DistributionList.Items) {
        if (!data.DistributionList.Items.hasOwnProperty(i)) {
          continue;
        }

        let cfData = data.DistributionList.Items[i];
        let distId = cfData.Id;
        let comment = cfData.Comment;

        this._checkPushStack(comment, distId, cfData);
      }

      if (data.DistributionList.IsTruncated) {
        let marker = data.DistributionList.NextMarker;

        this._listDistributions(cb, marker);
      } else {
        cb(null);
      }
    });
  }

  /**
   * @returns {String}
   */
  static get MAX_ITEMS() {
    return '100';
  }
}
