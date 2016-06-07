/**
 * Created by AlexanderC on 2/4/16.
 */

'use strict';

import {WaitFor} from '../../Helpers/WaitFor';
import {MissingModuleDBException} from './Exception/MissingModuleDBException';
import {SemVerStrategy} from './Strategy/SemVerStrategy';
import {NoVersionMatchingException} from './Exception/NoVersionMatchingException';

export class DependenciesResolver {
  /**
   * @param {ModuleConfig|*} baseModuleConfig
   * @param {Storage|*} storage
   * @param {SemVerStrategy|AbstractStrategy|null|*} strategy
   */
  constructor(baseModuleConfig, storage, strategy = null) {
    this._baseModuleConfig = baseModuleConfig;
    this._storage = storage;
    this._strategy = strategy || new SemVerStrategy();

    this._dbCache = {};
    this._configCache = {};

    // circular deps avoidance stack
    this._resolveUqStack = [];
  }

  /**
   * @param {Storage|*} storage
   * @param {SemVerStrategy|AbstractStrategy|null|*} strategy
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   *
   * @todo: Find out an elegant way to define optional strategy
   */
  static createUsingRawVersion(storage, strategy /* = null */, moduleName, moduleVersion, cb) {
    console.debug(`Looking for '${moduleName}' module DB`);

    storage.moduleDbExists(moduleName, (error, state) => {
      if (error) {
        cb(error, null);
      } else if(!state) {
        cb(new MissingModuleDBException(moduleName), null);
      } else {
        console.debug(`Fetching '${moduleName}' module DB`);

        storage.readModuleDb(moduleName, (error, moduleDB) => {
          if (error) {
            cb(error, null);
            return;
          }

          strategy = strategy || new SemVerStrategy();

          let matchedVersion = strategy.resolve(moduleDB, moduleVersion);

          if (!matchedVersion) {
            cb(new NoVersionMatchingException(moduleName, moduleVersion, moduleDB), null);
            return;
          }

          console.debug(`Fetching '${moduleName}@${matchedVersion}' module config`);

          storage.readModuleConfig(moduleName, matchedVersion, (error, moduleConfig) => {
            if (error) {
              cb(error, null);
              return;
            }

            cb(null, new DependenciesResolver(moduleConfig, storage, strategy));
          });
        });
      }
    });
  }

  /**
   * @param {SemVerStrategy|AbstractStrategy} strategy
   */
  set strategy(strategy) {
    this._strategy = strategy;
  }

  /**
   * @returns {SemVerStrategy|AbstractStrategy}
   */
  get strategy() {
    return this._strategy;
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {ModuleConfig|*}
   */
  get baseModuleConfig() {
    return this._baseModuleConfig;
  }

  /**
   * @param {Function} cb
   */
  resolve(cb) {
    this._resolve(this._baseModuleConfig.config.dependencies || {}, (error, depsTree) => {
      if (error) {
        cb(error, null);
        return;
      }

      cb(null, {
        name: this._baseModuleConfig.moduleName,
        rawVersion: this._baseModuleConfig.moduleVersion,
        version: this._baseModuleConfig.moduleVersion,
        dependencies: depsTree,
      });
    });
  }

  /**
   * @param {Object} deps
   * @param {Function} cb
   * @private
   */
  _resolve(deps, cb) {
    let cbCalled = false;
    let remaining = Object.keys(deps).length;
    let wait = new WaitFor();
    let depsTree = {};

    wait.push(() => {
      return remaining <= 0;
    });

    for (let dependencyName in deps) {
      if (!deps.hasOwnProperty(dependencyName)) {
        continue;
      }

      let dependencyVersion = deps[dependencyName];

      console.debug(`Resolving dependency '${dependencyName}@${dependencyVersion}'`);

      this._resolveSingle(dependencyName, dependencyVersion, (error, versionMatched) => {
        if (error || cbCalled) {
          remaining--;

          if (cbCalled) {
            return;
          }

          cbCalled = true;

          cb(error, null);
          return;
        }

        // @todo: remove circular deps check?
        let depUqKey = `${dependencyName}@${versionMatched}`;

        if (this._resolveUqStack.indexOf(depUqKey) !== -1) {
          console.warn(`Circular dependency '${depUqKey}' found`);

          depsTree[dependencyName] = {
            name: dependencyName,
            rawVersion: dependencyVersion,
            version: versionMatched,
            dependencies: null,
            _isCircular: true,
          };

          remaining--;
          return;
        } else {
          this._resolveUqStack.push(depUqKey);
        }

        let dependencyObject = {
          name: dependencyName,
          rawVersion: dependencyVersion,
          version: versionMatched,
          dependencies: {},
        };

        this._resolveNested(dependencyName, versionMatched, (error, nestedDepsTree) => {
          if (error) {
            if (!cbCalled) {
              cbCalled = true;
              cb(error, null);
            }
          } else {
            dependencyObject.dependencies = nestedDepsTree;
            depsTree[dependencyName] = dependencyObject;
          }

          remaining--;
        });
      });
    }

    wait.ready(() => {
      if (!cbCalled) {
        cb(null, depsTree);
      }
    });
  }

  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Function} cb
   * @private
   */
  _resolveNested(dependencyName, dependencyVersion, cb) {
    this._getModuleConfig(dependencyName, dependencyVersion, (error, moduleConfig) => {
      if (error) {
        cb(error, null);
        return;
      }

      this._resolve(moduleConfig.config.dependencies || {}, cb);
    })
  }

  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Function} cb
   * @private
   */
  _resolveSingle(dependencyName, dependencyVersion, cb) {
    this._getModuleDb(dependencyName, (error, moduleDB) => {
      if (error) {
        cb(error, null);
        return;
      }

      console.debug(`Resolving '${dependencyName}@${dependencyVersion}'`);

      let matchedVersion = this._strategy.resolve(moduleDB, dependencyVersion);

      if (!matchedVersion) {
        cb(new NoVersionMatchingException(dependencyName, dependencyVersion, moduleDB), null);
        return;
      }

      cb(null, matchedVersion);
    });
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   * @private
   */
  _getModuleConfig(moduleName, moduleVersion, cb) {
    let cacheKey = `${moduleName}@${moduleVersion}`;

    if (this._configCache.hasOwnProperty(cacheKey)) {
      console.debug(`Reading '${moduleName}@${moduleVersion}' module config from cache`);

      cb(null, this._configCache[cacheKey]);
      return;
    }

    console.debug(`Fetching '${moduleName}@${moduleVersion}' module config`);

    this._storage.readModuleConfig(moduleName, moduleVersion, (error, moduleConfig) => {
      if (error) {
        cb(error, null);
        return;
      }

      this._configCache[cacheKey] = moduleConfig;

      cb(null, moduleConfig);
    });
  }

  /**
   * @param {String} moduleName
   * @param {Function} cb
   * @private
   */
  _getModuleDb(moduleName, cb) {
    if (this._dbCache.hasOwnProperty(moduleName)) {
      console.debug(`Reading '${moduleName}' module DB from cache`);

      cb(null, this._dbCache[moduleName]);
      return;
    }

    console.debug(`Looking for '${moduleName}' module DB`);

    this._storage.moduleDbExists(moduleName, (error, state) => {
      if (error) {
        cb(error, null);
      } else if(!state) {
        cb(new MissingModuleDBException(moduleName), null);
      } else {
        console.debug(`Fetching '${moduleName}' module DB`);

        this._storage.readModuleDb(moduleName, (error, moduleDB) => {
          if (error) {
            cb(error, null);
            return;
          }

          this._dbCache[moduleName] = moduleDB;

          cb(null, moduleDB);
        });
      }
    });
  }

  /**
   * @returns {String}
   */
  static get VERSION_ANY() {
    return '*';
  }
}
