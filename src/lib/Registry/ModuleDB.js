/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {BrokenModuleDBException} from './Exception/BrokenModuleDBException';

export class ModuleDB {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this._config = config;
  }

  /**
   * @param {String} rawConfig
   * @returns {ModuleDB}
   */
  static createFromRawConfig(rawConfig) {
    let config = ModuleDB._decode(rawConfig);

    if (!config) {
      throw new BrokenModuleDBException();
    }

    return new ModuleDB(config);
  }

  /**
   * @returns {String}
   */
  toString() {
    return ModuleDB._encode(this.config);
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
