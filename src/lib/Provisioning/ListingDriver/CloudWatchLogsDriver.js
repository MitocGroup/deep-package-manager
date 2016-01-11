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
   * @param {Function} cb
   */
  list(cb) {
    this._listLogGroups(cb);
  }

  /**
   * @param {Function} cb
   * @param {String|null} nextToken
   * @private
   */
  _listLogGroups(cb, nextToken = null) {
    let payload = {
      limit: CloudWatchLogsDriver.LIMIT,
      logGroupNamePrefix: CloudWatchLogsDriver.LAMBDA_LOG_GROUP_PREFIX
    };

    if (nextToken) {
      payload.nextToken = nextToken;
    }

    this._awsService.describeLogGroups(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.logGroups) {
        if (!data.logGroups.hasOwnProperty(i)) {
          continue;
        }

        let cwlData = data.logGroups[i];
        let groupName = cwlData.logGroupName;

        this._checkPushStack(groupName, groupName, cwlData);
      }

      if (data.logGroups.nextToken) {
        let nextBatchToken = data.logGroups.nextToken;

        this._listDistributions(cb, nextBatchToken);
      } else {
        cb(null);
      }
    });
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_LOG_GROUP_PREFIX() {
    return '/aws/lambda/';
  }

  /**
   * @returns {Number}
   */
  static get LIMIT() {
    return 50;
  }
}
