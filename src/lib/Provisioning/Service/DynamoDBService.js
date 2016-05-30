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
      this._rawModels,
      this._rawModelsSettings
    )((tablesNames) => {
      this._config.tablesNames = tablesNames;

      this._ready = true;
    });

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
   * @param {Object} modelsSettings
   * @returns {Function}
   * @private
   */
  _createDbTables(models, modelsSettings) {
    let tablesNames = this.generateTableNames(models);
    let tablesSettings = this.generateTableSettings(modelsSettings);
    let missingTablesNames = [];

    if (this._isUpdate) {
      let tablesNamesVector = DynamoDBService._objectValues(tablesNames);

      missingTablesNames = DynamoDBService._objectValues(this._config.tablesNames)
        .filter((x) => tablesNamesVector.indexOf(x) < 0);
    }

    let deepDb = new DB(models, tablesNames);

    // @todo waiting for https://github.com/aws/aws-sdk-js/issues/710 to be fixed
    deepDb._setVogelsDriver(this.provisioning.dynamoDB);

    // @todo: move this functionality?
    this._provisioning.db = deepDb;

    return (callback) => {
      for (let name in tablesSettings) {
        if (!tablesSettings.hasOwnProperty(name)) {
          continue;
        }

        console.info(`DynamoDB model '${name}' -> ${JSON.stringify(tablesSettings[name])}`);
      }

      deepDb.assureTables(() => {
        if (missingTablesNames.length <= 0) {
          callback(tablesNames);
          return;
        }

        this._removeMissingTables(missingTablesNames, () => {
          callback(tablesNames);
        });
      }, tablesSettings);
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
    console.log(`Removing DynamoDB tables: ${missingTablesNames.join(', ')}`);

    for (let i in missingTablesNames) {
      if (!missingTablesNames.hasOwnProperty(i)) {
        continue;
      }

      let tableName = missingTablesNames[i];

      this.provisioning.dynamoDB.deleteTable({
        TableName: tableName,
      }, (error, data) => {
        if (error) {
          console.error(`Error while deleting DynamoDB table ${tableName}: ${error}`);
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
   * @returns {Object}
   * @private
   */
  get _rawModelsSettings() {
    return this.provisioning.property.config.modelsSettings;
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

  /**
   * @param {Object} modelsSettings
   * @returns {Object}
   */
  generateTableSettings(modelsSettings) {
    let tables = {};

    for (let modelKey in modelsSettings) {
      if (!modelsSettings.hasOwnProperty(modelKey)) {
        continue;
      }

      let backendModelsSettings = modelsSettings[modelKey];

      for (let modelName in backendModelsSettings) {
        if (!backendModelsSettings.hasOwnProperty(modelName)) {
          continue;
        }

        let tableName = this.generateAwsResourceName(modelName, Core.AWS.Service.DYNAMO_DB);
        tables[tableName] = backendModelsSettings[modelName];
      }
    }

    return tables;
  }
}
