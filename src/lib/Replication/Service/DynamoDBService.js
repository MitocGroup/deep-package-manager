/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from './AbstractService';
import {NoSuchModelException} from '../Exception/NoSuchModelException';

export class DynamoDBService extends AbstractService {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._dynamoDb = null;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.DYNAMO_DB;
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
  disableDynamoDBStreams(tableName) {
    return this._toggleDynamoDbStreamReplication(tableName, false);
  }

  /**
   * @param {String} tableName
   * @returns {Promise}
   */
  enableDynamoDBStreams(tableName) {
    return this._toggleDynamoDbStreamReplication(tableName, true);
  }

  /**
   * @param {String} tableName
   * @param {Boolean} enable
   * @returns {Promise}
   * @private
   */
  _toggleDynamoDbStreamReplication(tableName, enable) {
    return this._dynamoDb.describeTable({
      TableName: tableName,
    }).promise()
      .then(response => {
        let tableConfig = response.Table;
        let streamSpecification = tableConfig.StreamSpecification || {};
        let payload = null;

        if (enable) {
          if (streamSpecification.StreamEnabled && streamSpecification.StreamViewType === 'NEW_AND_OLD_IMAGES') {
            return Promise.resolve(tableConfig);
          }

          streamSpecification.StreamEnabled = true;
          streamSpecification.StreamViewType = 'NEW_AND_OLD_IMAGES';

          payload = {
            TableName: tableConfig.TableName,
            StreamSpecification: streamSpecification,
          };
        } else {
          if (!streamSpecification.StreamEnabled) {
            return Promise.resolve(tableConfig);
          }

          payload = {
            TableName: tableConfig.TableName,
            StreamSpecification: {
              StreamEnabled: false,
            }
          };
        }

        return this._retryableRequest(this._dynamoDb.updateTable(payload)).promise()
           // recursive call to force table retrieve again
          .then(() => this.enableDynamoDBStreams(tableName));
      });
  }

  /**
   * @returns {Object}
   */
  buildTableReplicationMap() {
    let map = {};
    let reverseMap = {};

    let blueTables = this.blueConfig().tablesNames;
    let greenTables = this.greenConfig().tablesNames;

    for (let tableName in blueTables) {
      if (blueTables.hasOwnProperty(tableName) && greenTables.hasOwnProperty(tableName)) {
        map[blueTables[tableName]] = greenTables[tableName];
        reverseMap[greenTables[tableName]] = blueTables[tableName];
      } else {
        console.warn(`Missing "${tableName}" model in Green Env!`);
      }
    }

    return Object.assign(map, reverseMap);
  }

  /**
   * @param {String} tableName
   * @returns {String|null}
   */
  getAwsBlueTableName(tableName) {
    return this._getAwsTableName(
      tableName,
      this.blueConfig().tablesNames
    );
  }

  /**
   * @param {String} tableName
   * @returns {String|null}
   */
  getAwsGreenTableName(tableName) {
    return this._getAwsTableName(
      tableName,
      this.greenConfig().tablesNames
    );
  }

  /**
   * @param {String} tableName
   * @param {Object} _tableNames
   * @returns {*}
   * @private
   */
  _getAwsTableName(tableName, _tableNames) {
    for (let name in _tableNames) {
      if (!_tableNames.hasOwnProperty(name)) {
        continue;
      }

      if (name === tableName || _tableNames[name] === tableName) {
        return _tableNames[name];
      }
    }

    throw new NoSuchModelException(tableName);
  }

  /**
   * @param {String} tableName
   * @returns {Promise}
   */
  getItemCount(tableName) {
    return this._dynamoDb
      .describeTable({
        TableName: tableName,
      })
      .promise()
      .then(response => response.Table.ItemCount);
  }
}
