/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class DynamoDBDriver extends AbstractDriver {
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
    return 'DynamoDB';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeTable(resourceId, cb);
  }

  /**
   * @param {String} tableName
   * @param {Function} cb
   * @param {Number} retries
   * @private
   */
  _removeTable(tableName, cb, retries = 0) {
    this._awsService.deleteTable({
      TableName: tableName,
    }, (error) => {
      if (error) {
        if (retries >= DynamoDBDriver.MAX_ON_LIMIT_RETRIES) {
          cb(error);
        } else { // @todo: remove hook when fixed

          // Fix:
          //      LimitExceededException: Subscriber limit exceeded:
          //      Only 10 tables can be created, updated, or deleted simultaneously
          setTimeout(() => {
            this._removeTable(tableName, cb, retries++);
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
  static get MAX_ON_LIMIT_RETRIES() {
    return 10;
  }
}
