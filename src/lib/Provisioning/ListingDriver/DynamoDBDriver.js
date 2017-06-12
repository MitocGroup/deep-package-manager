/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {DynamoDBService} from '../Service/DynamoDBService';

export class DynamoDBDriver extends AbstractDriver {
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
    return DynamoDBService.AVAILABLE_REGIONS;
  }

  /**
   * @param {Function} cb
   * @param {String|undefined} _lastTableName
   */
  list(cb, _lastTableName) {
    this._awsService.listTables({
      Limit: DynamoDBDriver.LIMIT,
      ExclusiveStartTableName: _lastTableName,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.TableNames) {
        if (!data.TableNames.hasOwnProperty(i)) {
          continue;
        }

        let tableName = data.TableNames[i];

        this._checkPushStack(tableName, tableName);
      }

      if (data.LastEvaluatedTableName && data.TableNames.length > 0) {
        return this.list(cb, data.LastEvaluatedTableName);
      }

      cb(null);
    });
  }

  /**
   * @returns {Number}
   */
  static get LIMIT() {
    return 100;
  }
}
