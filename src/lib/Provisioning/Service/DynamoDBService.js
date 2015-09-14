/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import DB from '@mitocgroup/deep-db';

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
      this._config = {
        tablesNames: tablesNames,
      };

      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
   */
  _postProvision(services) {
    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
   */
  _postDeployProvision(services) {
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

    let deepDb = new DB(models, tablesNames);

    return function(callback) {
      deepDb.assureTables(function() {
        callback(tablesNames);
      });
    }.bind(this);
  }

  /**
   * @returns {Object}
   * @private
   */
  get _rawModels() {
    return this.provisioning.property.config.models;
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
