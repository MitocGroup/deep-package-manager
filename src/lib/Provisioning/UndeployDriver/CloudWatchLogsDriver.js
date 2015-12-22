/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CloudWatchLogsDriver extends AbstractDriver {
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
    return 'CloudWatchLogs';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeLogGroup(resourceId, cb);
  }

  /**
   * @param {String} logGroupName
   * @param {Function} cb
   * @param {Number} retries
   * @private
   */
  _removeLogGroup(logGroupName, cb, retries = 0) {
    this._awsService.deleteLogGroup({
      logGroupName: logGroupName,
    }, (error) => {
      if (error) {
        if (retries >= CloudWatchLogsDriver.MAX_ON_CONFLICT_RETRIES) {
          cb(error);
        } else { // @todo: remove hook when fixed

          // Fix:
          //      OperationAbortedException: A conflicting operation is currently
          //      in progress against this resource. Please try again.
          setTimeout(() => {
            this._removeLogGroup(logGroupName, cb, retries++)
          }, 300);
        }

        return;
      }

      cb(null);
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_ON_CONFLICT_RETRIES() {
    return 10;
  }
}
