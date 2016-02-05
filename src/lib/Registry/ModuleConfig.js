/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {Config} from '../Microservice/Config';
import {BrokenModuleConfigException} from './Exception/BrokenModuleConfigException';

export class ModuleConfig {
  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Object} config
   * @param {Storage|*} storage
   */
  constructor(moduleName, moduleVersion, config, storage) {
    this._moduleName = moduleName;
    this._moduleVersion = moduleVersion;
    this._storage = storage;

    let configObj = new Config(config);

    if (!configObj.valid) {
      throw new BrokenModuleConfigException(moduleName, moduleVersion);
    }

    try {
      this._config = configObj.extract();
    } catch (e) {
      throw new BrokenModuleConfigException(moduleName, moduleVersion);
    }
  }

  /**
   * @param {Function} cb
   */
  dump(cb) {
    this._storage.dumpModuleConfig(this, cb);
  }

  /**
   * @returns {String}
   */
  toString() {
    return ModuleConfig._encode(this.config);
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {String}
   */
  get moduleName() {
    return this._moduleName;
  }

  /**
   * @returns {String}
   */
  get moduleVersion() {
    return this._moduleVersion;
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
