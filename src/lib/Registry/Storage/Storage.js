/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {TmpFSDriver} from './Driver/TmpFSDriver';
import {StdStrategy} from './Strategy/StdStrategy';
import {ModuleDB} from '../ModuleDB';

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
        cb(null, ModuleDB.createFromRawConfig(rawContent));
      } catch (error) {
        cb(error, null);
      }
    });
  }

  /**
   * @param {String} moduleName
   * @param {ModuleDB|String} moduleDb
   * @param {Function} cb
   */
  dumpModuleDb(moduleName, moduleDb, cb) {
    this._driver.putObj(this._strategy.getDbLocation(moduleName), moduleDb, cb);
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
