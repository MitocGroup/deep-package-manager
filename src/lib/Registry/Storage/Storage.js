/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {TmpFSDriver} from './Driver/TmpFSDriver';
import {StdStrategy} from './Strategy/StdStrategy';
import {ModuleDB} from '../ModuleDB';
import {ModuleConfig} from '../ModuleConfig';
import {Module} from '../Module';

export class Storage {
  /**
   * @param {TmpFSDriver} driver
   * @param {StdStrategy} strategy
   */
  constructor(driver = null, strategy = null) {
    this._driver = driver || Storage.DEFAULT_DRIVER;
    this._strategy = strategy || Storage.DEFAULT_STRATEGY;
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  moduleExists(moduleName, moduleVersion, cb) {
    this._driver.hasObj(this._strategy.getModuleLocation(moduleName, moduleVersion), cb);
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  readModule(moduleName, moduleVersion, cb) {
    this._driver.readObj(this._strategy.getModuleLocation(moduleName, moduleVersion), (error, rawContent) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, new Module(moduleName, moduleVersion, rawContent, this));
      } catch (error) {
        cb(error, null);
      }
    });
  }

  /**
   * @param {Module} module
   * @param {Function} cb
   */
  uploadModule(module, cb) {
    this._driver.putObj(
      this._strategy.getModuleLocation(module.moduleName, module.moduleVersion),
      module,
      cb
    );
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  deleteModule(moduleName, moduleVersion, cb) {
    this._driver.deleteObj(this._strategy.getModuleLocation(moduleName, moduleVersion), cb);
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  moduleConfigExists(moduleName, moduleVersion, cb) {
    this._driver.hasObj(this._strategy.getModuleConfigLocation(moduleName, moduleVersion), cb);
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  readModuleConfig(moduleName, moduleVersion, cb) {
    this._driver.readObj(this._strategy.getModuleConfigLocation(moduleName, moduleVersion), (error, rawContent) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, new ModuleConfig(moduleName, moduleVersion, rawContent, this));
      } catch (error) {
        cb(error, null);
      }
    });
  }

  /**
   * @param {ModuleConfig} moduleConfig
   * @param {Function} cb
   */
  dumpModuleConfig(moduleConfig, cb) {
    this._driver.putObj(
      this._strategy.getModuleConfigLocation(moduleConfig.moduleName, moduleConfig.moduleVersion),
      moduleConfig,
      cb
    );
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  deleteModuleConfig(moduleName, moduleVersion, cb) {
    this._driver.deleteObj(this._strategy.getModuleConfigLocation(moduleName, moduleVersion), cb);
  }

  /**
   * @param {String} moduleName
   * @param {Function} cb
   */
  moduleDbExists(moduleName, cb) {
    this._driver.hasObj(this._strategy.getDbLocation(moduleName), cb);
  }

  /**
   * @param {String} moduleName
   * @param {Function} cb
   */
  readModuleDb(moduleName, cb) {
    this._driver.readObj(this._strategy.getDbLocation(moduleName), (error, rawContent) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, ModuleDB.createFromRawConfig(moduleName, this, rawContent));
      } catch (error) {
        cb(error, null);
      }
    });
  }

  updateModuleDb(moduleName, moduleVersion, cb) {

  }

  /**
   * @param {ModuleDB} moduleDb
   * @param {Function} cb
   */
  dumpModuleDb(moduleDb, cb) {
    this._driver.putObj(this._strategy.getDbLocation(moduleDb.moduleName), moduleDb, cb);
  }

  /**
   * @param {String} moduleName
   * @param {Function} cb
   */
  deleteModuleDb(moduleName, cb) {
    this._driver.deleteObj(this._strategy.getDbLocation(moduleName), cb);
  }

  /**
   * @returns {TmpFSDriver}
   */
  get driver() {
    return this._driver;
  }

  /**
   * @returns {StdStrategy}
   */
  get strategy() {
    return this._strategy;
  }

  /**
   * @returns {TmpFSDriver}
   */
  static get DEFAULT_DRIVER() {
    return new TmpFSDriver();
  }

  /**
   * @returns {StdStrategy}
   */
  static get DEFAULT_STRATEGY() {
    return new StdStrategy();
  }
}
