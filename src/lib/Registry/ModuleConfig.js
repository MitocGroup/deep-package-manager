/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {Config} from '../Microservice/Config';
import {Context} from './Context/Context';
import {BrokenModuleConfigException} from './Exception/BrokenModuleConfigException';
import fse from 'fs-extra';
import path from 'path';
import {Instance as Microservice} from '../Microservice/Instance';

export class ModuleConfig {
  /**
   * @param {Context} moduleContext
   * @param {Object} config
   * @param {Storage|*} storage
   */
  constructor(moduleContext, config, storage) {
    this._context = moduleContext;
    this._storage = storage;

    let configObj = new Config(config);

    if (!configObj.valid) {
      throw new BrokenModuleConfigException(moduleContext);
    }

    try {
      this._config = configObj.extract();
    } catch (e) {
      throw new BrokenModuleConfigException(moduleContext);
    }
  }

  /**
   * @param {Storage|*} storage
   * @param {String} modulePath
   * @param {Function} cb
   */
  static createFromModulePath(storage, modulePath, cb) {
    fse.readJson(path.join(modulePath, Microservice.CONFIG_FILE), (error, configObj) => {
      if (error) {
        cb(error, null);
        return;
      }

      cb(
        null,
        new ModuleConfig(
          Context.create(configObj.identifier, configObj.version),
          configObj,
          storage
        )
      );
    })
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
    return this._context.name;
  }

  /**
   * @returns {String}
   */
  get moduleVersion() {
    return this._context.version;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * @returns {Context}
   */
  get context() {
    return this._context;
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
