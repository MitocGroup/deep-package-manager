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
   * @param {Function} cb
   */
  list(cb) {
    this._awsService.listTables({
      Limit: DynamoDBDriver.LIMIT,
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
