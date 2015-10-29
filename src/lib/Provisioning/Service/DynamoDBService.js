/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import DB from 'deep-db';

/**
 * DynamoDB service
 */
export class DynamoDBService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.DYNAMO_DB;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
   */
  _setup(services) {
    this._createDbTables(
      this._rawModels
    )(function(tablesNames) {
      this._config.tablesNames = tablesNames;

      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {Object} models
   * @returns {Function}
   * @private
   */
  _createDbTables(models) {
    let tablesNames = this.generateTableNames(models);
    let missingTablesNames = [];

    if (this._isUpdate) {
      let tablesNamesVector = DynamoDBService._objectValues(tablesNames);

      missingTablesNames = DynamoDBService._objectValues(this._config.tablesNames)
        .filter((x) => tablesNamesVector.indexOf(x) < 0);
    }

    let deepDb = new DB(models, tablesNames);

    // @todo waiting for https://github.com/aws/aws-sdk-js/issues/710 to be fixed
    deepDb._setVogelsDriver(this.provisioning.dynamoDB);

    return (callback) => {
      deepDb.assureTables(() => {
        if (missingTablesNames.length <= 0) {
          callback(tablesNames);
          return;
        }

        this._removeMissingTables(missingTablesNames, () => {
          callback(tablesNames);
        });
      });
    };
  }

  /**
   * @param {Object} obj
   * @returns {Array}
   * @private
   */
  static _objectValues(obj) {
    let values = [];

    for (let tableId in obj) {
      if (!obj.hasOwnProperty(tableId)) {
        continue;
      }

      values.push(obj[tableId]);
    }

    return values;
  }

  /**
   * @param {String[]} missingTablesNames
   * @param {Function} callback
   * @returns {DynamoDBService}
   * @private
   */
  _removeMissingTables(missingTablesNames, callback) {
    console.log(`${new Date().toTimeString()} Removing DynamoDB tables: ${missingTablesNames.join(', ')}`);

    for (let tableName of missingTablesNames) {
      this.provisioning.dynamoDB.deleteTable({
        TableName: tableName,
      }, (error, data) => {
        if (error) {
          console.error(`${new Date().toTimeString()} Error while deleting DynamoDB table ${tableName}: ${error}`);
        }
      });
    }

    // @todo: leave it async?
    callback();

    return this;
  }

  /**
   * @returns {Object}
   * @private
   */
  get _rawModels() {
    return this.provisioning.property.config.models;
  }

  /**
   * @param {String} uniqueHash
   * @param {String} env
   * @returns {String}
   */
  static getTablesResourceMask(uniqueHash, env) {
    return AbstractService.capitalizeFirst(AbstractService.AWS_RESOURCES_PREFIX) +
      AbstractService.capitalizeFirst(env) +
      '*' +
      uniqueHash;
  }

  /**
   * @param {Object} models
   * @returns {Object}
   */
  generateTableNames(models) {
    let tables = {};

    for (let modelKey in models) {
      if (!models.hasOwnProperty(modelKey)) {
        continue;
      }

      let backendModels = models[modelKey];

      for (let modelName in backendModels) {
        if (!backendModels.hasOwnProperty(modelName)) {
          continue;
        }

        tables[modelName] = this.generateAwsResourceName(modelName, Core.AWS.Service.DYNAMO_DB);
      }
    }

    return tables;
  }
}
