/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {TmpFSDriver} from './Driver/TmpFSDriver';
import {ModuleDB} from '../DB/ModuleDB';
import {SmartStrategy} from './Strategy/SmartStrategy';
import {ComplexDriver} from './Driver/ComplexDriver';
import {GitHubDriver} from './Driver/GitHubDriver';
import {ModuleConfig} from '../ModuleConfig';
import {ModuleInstance} from '../Module/ModuleInstance';
import {ModuleDBLockedException} from './Exception/ModuleDBLockedException';

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
   * @param {String} moduleContext
   * @param {Function} cb
   */
  moduleExists(moduleContext, cb) {
    this._driver.hasObj(this._strategy.getModuleLocation(moduleContext), cb);
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  readModule(moduleContext, cb) {
    this._driver.readObj(this._strategy.getModuleLocation(moduleContext), (error, rawContent) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, ModuleInstance.create(moduleContext, rawContent, this));
      } catch (error) {
        cb(error, null);
      } finally {
        return;
      }
    });
  }

  /**
   * @param {ModuleInstance} moduleObj
   * @param {Function} cb
   */
  uploadModule(moduleObj, cb) {
    this._driver.putObj(
      this._strategy.getModuleLocation(moduleObj.context),
      moduleObj,
      cb
    );
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  deleteModule(moduleContext, cb) {
    this._driver.deleteObj(this._strategy.getModuleLocation(moduleContext), cb);
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  moduleConfigExists(moduleContext, cb) {
    this._driver.hasObj(this._strategy.getModuleConfigLocation(moduleContext), cb);
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  readModuleConfig(moduleContext, cb) {
    this._driver.readObj(this._strategy.getModuleConfigLocation(moduleContext), (error, rawContent) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, new ModuleConfig(moduleContext, rawContent, this));
      } catch (error) {
        cb(error, null);
      } finally {
        return;
      }
    });
  }

  /**
   * @param {ModuleConfig} moduleConfig
   * @param {Function} cb
   */
  dumpModuleConfig(moduleConfig, cb) {
    this._driver.putObj(
      this._strategy.getModuleConfigLocation(moduleConfig.context),
      moduleConfig,
      cb
    );
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  deleteModuleConfig(moduleContext, cb) {
    this._driver.deleteObj(this._strategy.getModuleConfigLocation(moduleContext), cb);
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  moduleDbExists(moduleContext, cb) {
    this._driver.hasObj(this._strategy.getDbLocation(moduleContext), cb);
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  readModuleDb(moduleContext, cb) {
    this._driver.readObj(this._strategy.getDbLocation(moduleContext), (error, rawContent) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, ModuleDB.createFromRawConfig(moduleContext, this, rawContent));
      } catch (error) {
        cb(error, null);
      } finally {
        return;
      }
    });
  }

  /**
   * @param {Context} moduleContext
   * @param {Function} cb
   */
  updateModuleDb(moduleContext, cb) {
    let dbObjPath = this._strategy.getDbLocation(moduleContext);

    this._driver.isObjLocked(dbObjPath, (error, state) => {
      if (error) {
        cb(error);
      } else if (state) {
        cb(new ModuleDBLockedException(moduleContext));
      } else {
        this._driver.lockObj(dbObjPath, (error) => {
          if (error) {
            cb(error);
            return;
          }

          this.moduleDbExists(moduleContext, (error, state) => {
            if (error) {
              this._driver.releaseObjLock(dbObjPath, () => {
                cb(error);
              });

              return;
            }

            if (state) {
              this.readModuleDb(moduleContext, (error, moduleDb) => {
                if (error) {
                  this._driver.releaseObjLock(dbObjPath, () => {
                    cb(error);
                  });

                  return;
                }

                moduleDb.addVersion(moduleContext.version);

                this.dumpModuleDb(moduleDb, (error) => {
                  this._driver.releaseObjLock(dbObjPath, () => {
                    cb(error);
                  });
                });
              });
            } else {
              let moduleDb = ModuleDB.createFromRawConfig(moduleContext, this, '{}');

              moduleDb.addVersion(moduleContext.version);

              this.dumpModuleDb(moduleDb, (error) => {
                this._driver.releaseObjLock(dbObjPath, () => {
                  cb(error);
                });
              });
            }
          });
        });
      }
    });
  }

  /**
   * @param {ModuleDB} moduleDb
   * @param {Function} cb
   */
  dumpModuleDb(moduleDb, cb) {
    this._driver.putObj(this._strategy.getDbLocation(moduleDb.context), moduleDb, cb);
  }

  /**
   * @param {String} moduleContext
   * @param {Function} cb
   */
  deleteModuleDb(moduleContext, cb) {
    this._driver.deleteObj(this._strategy.getDbLocation(moduleContext), cb);
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
   * @returns {ComplexDriver}
   */
  static get DEFAULT_DRIVER() {
    return new ComplexDriver(
      new TmpFSDriver(),
      new GitHubDriver()
    );
  }

  /**
   * @returns {SmartStrategy}
   */
  static get DEFAULT_STRATEGY() {
    return new SmartStrategy();
  }
}
