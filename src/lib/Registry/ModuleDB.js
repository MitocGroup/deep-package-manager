/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {BrokenModuleDBException} from './Exception/BrokenModuleDBException';

export class ModuleDB {
  /**
   * @param {String} moduleName
   * @param {Object} config
   * @param {Storage|*} storage
   */
  constructor(moduleName, config, storage) {
    this._moduleName = moduleName;
    this._config = config;
    this._storage = storage;
  }

  /**
   * @param {Function} cb
   */
  dump(cb) {
    this._storage.dumpModuleDb(this, cb);
  }

  /**
   * @param {String} moduleName
   * @param {Storage|*} storage
   * @param {String} rawConfig
   * @returns {ModuleDB}
   */
  static createFromRawConfig(moduleName, storage, rawConfig) {
    let config = ModuleDB._decode(rawConfig);

    if (!config) {
      throw new BrokenModuleDBException(this._moduleName);
    }

    return new ModuleDB(moduleName, config, storage);
  }

  /**
   * @returns {String}
   */
  toString() {
    return ModuleDB._encode(this.config);
  }

  /**
   * @returns {String}
   */
  get moduleName() {
    return this._moduleName;
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
