/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import {AbstractManager} from './AbstractManager';

export class DynamoDBManager extends AbstractManager {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._dynamoDb = null;
  }

  /**
   * @param {Object} dynamoDb
   */
  set dynamoDb(dynamoDb) {
    this._dynamoDb = dynamoDb;
  }

  /**
   * @param {String} tableName
   * @returns {Promise}
   */
  enableDynamoDBStreams(tableName) {
    return this._dynamoDb.describeTable({
      TableName: tableName,
    }).promise()
      .then(response => {
        let tableConfig = response.Table;
        let streamSpecification = tableConfig.StreamSpecification;

        if (streamSpecification.StreamEnabled && streamSpecification.StreamViewType === 'NEW_AND_OLD_IMAGES') {
          return Promise.resolve(tableConfig);
        }

        streamSpecification.StreamEnabled = true;
        streamSpecification.StreamViewType = 'NEW_AND_OLD_IMAGES';

        return this._dynamoDb.updateTable(tableConfig).promise().then(r => r.Table);
      });
  }
}
