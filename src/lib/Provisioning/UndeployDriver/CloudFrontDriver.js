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
   * @returns {String}
   */
  service() {
    return 'CloudFront';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeDistribution(resourceId, cb);
  }

  /**
   * @param {String} distId
   * @param {Function} cb
   * @private
   */
  _removeDistribution(distId, cb) {
    this._awsService.getDistributionConfig({
      Id: distId,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      let distConfig = data.DistributionConfig;

      if (!distConfig.Enabled) {
        let isDeployed = data.DistributionConfig.Status === 'Deployed';
        let addMsg = '...';

        if (!isDeployed) {
          addMsg = ' but not yet deployed. Waiting...';
        }

        this._log('The CloudFront distribution '
          + distId + ' is already disabled' + addMsg);

        if (!isDeployed) {
          this._waitForDistDisabled(distId, data.ETag, (distId, eTag) => {
            this._nativeDeleteDistribution(distId, eTag, cb);
          });
        } else {
          this._nativeDeleteDistribution(distId, data.ETag, cb);
        }

        return;
      }

      distConfig.Enabled = false;

      this._awsService.updateDistribution({
        Id: distId,
        IfMatch: data.ETag,
        DistributionConfig: distConfig,
      }, (error, data) => {
        if (error) {
          cb(error);
          return;
        }

        this._waitForDistDisabled(distId, data.ETag, (distId, eTag) => {
          this._nativeDeleteDistribution(distId, eTag, cb);
        });
      });
    });
  }

  /**
   * @param {String} distId
   * @param {String} eTag
   * @param {Function} cb
   * @private
   */
  _nativeDeleteDistribution(distId, eTag, cb) {
    this._awsService.deleteDistribution({
      Id: distId,
      IfMatch: eTag,
    }, (error) => {
      if (error) {
        cb(error);
        return;
      }

      cb(null);
    });
  }

  /**
   * @param {String} distId
   * @param {String} eTag
   * @param {Function} cb
   * @param {Number|null} estTime
   * @private
   */
  _waitForDistDisabled(distId, eTag, cb, estTime = null) {
    estTime = null === estTime ? 15 * 60 : estTime;

    this._awsService.getDistribution({
      Id: distId,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      let status = data.Distribution.Status;

      if (status !== 'Deployed') {
        let estTimeMinutes = (estTime / 60);

        if (estTimeMinutes <= 0) {
          this._log(
            `Waiting for CloudFront distribution ${distId} to be disabled`,
            `(currently ${status}, ETC ...)`
          );
        } else {
          this._log(
            `Waiting for CloudFront distribution ${distId} to be disabled`,
            `(currently ${status}, ETC ${estTimeMinutes} min.)`
          );
        }

        setTimeout(() => {
          this._waitForDistDisabled(distId, eTag, cb, estTime - 30);
        }, 1000 * 30);

        return;
      }

      cb(distId, eTag);
    });
  }
}
