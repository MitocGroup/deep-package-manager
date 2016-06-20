/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {BrokenModuleDBException} from '../Exception/BrokenModuleDBException';
import {GitHubContext} from '../Context/GitHubContext';
import {GitHubDB} from './GitHubDB';
import {AbstractModuleDB} from './AbstractModuleDB';

export class ModuleDB extends AbstractModuleDB {
  /**
   * @param {Context} moduleContext
   * @param {Object} config
   * @param {Storage|*} storage
   */
  constructor(moduleContext, config, storage) {
    super();

    this._context = moduleContext;
    this._config = config;
    this._storage = storage;
  }

  /**
   * @param {String} moduleVersion
   * @param {Object} versionMetadata
   */
  addVersion(moduleVersion, versionMetadata = {}) {
    this._config[moduleVersion] = versionMetadata;
  }

  /**
   * @returns {String[]}
   */
  getVersions() {
    return Object.keys(this._config);
  }

  /**
   * @param {String} version
   * @returns {Object}
   */
  getVersionDetails(version) {
    return this._config[version];
  }

  /**
   * @param {Function} cb
   */
  dump(cb) {
    this._storage.dumpModuleDb(this, cb);
  }

  /** 
   * @param {String} moduleContext
   * @param {Storage} storage
   * @param {Object} configObj
   * @returns {null|GitHubDB, ModuleDB}
   */
  static create(moduleContext, storage, configObj) {
    let DBProto = moduleContext instanceof GitHubContext ? GitHubDB : ModuleDB;

    return new DBProto(moduleContext, configObj, storage);
  }

  /**
   * @param {Context} moduleContext
   * @param {Storage|*} storage
   * @param {String} rawConfig
   * @returns {ModuleDB}
   */
  static createFromRawConfig(moduleContext, storage, rawConfig) {
    let config = ModuleDB._decode(rawConfig);

    if (!config) {
      throw new BrokenModuleDBException(moduleContext);
    }

    return ModuleDB.create(moduleContext, storage, config);
  }

  /**
   * @returns {String}
   */
  toString() {
    return ModuleDB._encode(this.config);
  }

  /**
   * @returns {Context}
   */
  get context() {
    return this._context;
  }

  /**
   * @returns {String}
   */
  get moduleName() {
    return this._context.name;
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * @param {String} rawConfig
   * @returns {Object|null}
   * @private
   */
  static _decode(rawConfig) {
    try {
      return JSON.parse(rawConfig);
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {Object} config
   * @returns {String}
   * @private
   */
  static _encode(config) {
    return JSON.stringify(config);
  }
}
