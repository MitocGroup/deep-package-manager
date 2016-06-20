/**
 * Created by AlexanderC on 2/4/16.
 */

'use strict';

import {WaitFor} from '../../Helpers/WaitFor';
import {MissingModuleDBException} from './Exception/MissingModuleDBException';
import {SemVerStrategy} from './Strategy/SemVerStrategy';
import {NoVersionMatchingException} from './Exception/NoVersionMatchingException';
import {Context} from '../Context/Context';

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
   * @param {Context} moduleContext
   * @param {Function} cb
   *
   * @todo: Find out an elegant way to define optional strategy
   */
  static createUsingRawVersion(storage, strategy /* = null */, moduleContext, cb) {
    console.debug(`Looking for '${moduleContext.name}' module DB`);

    storage.moduleDbExists(moduleContext, (error, state) => {
      if (error) {
        cb(error, null);
      } else if(!state) {
        cb(new MissingModuleDBException(moduleContext), null);
      } else {
        console.debug(`Fetching '${moduleContext.name}' module DB`);

        storage.readModuleDb(moduleContext, (error, moduleDB) => {
          if (error) {
            cb(error, null);
            return;
          }

          strategy = strategy || new SemVerStrategy();

          let matchedVersion = strategy.resolve(moduleDB, moduleContext.version);

          if (!matchedVersion) {
            cb(new NoVersionMatchingException(moduleContext, moduleDB), null);
            return;
          }

          moduleContext.version = matchedVersion;
          console.debug(`Fetching '${moduleContext}' module config`);

          storage.readModuleConfig(moduleContext, (error, moduleConfig) => {
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
        context: this._baseModuleConfig.context,
        rawVersion: this._baseModuleConfig.moduleVersion,
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
      let moduleContext = Context.create(dependencyName, dependencyVersion);

      console.debug(`Resolving dependency '${dependencyName}@${dependencyVersion}'`);

      this._resolveSingle(moduleContext, (error, moduleContext) => {
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
        let depUqKey = `${moduleContext.name}@${moduleContext.version}`;

        if (this._resolveUqStack.indexOf(depUqKey) !== -1) {
          console.warn(`Circular dependency '${depUqKey}' found`);

          depsTree[moduleContext.name] = {
            context: moduleContext,
            rawVersion: dependencyVersion,
            dependencies: null,
            _isCircular: true,
          };

          remaining--;
          return;
        } else {
          this._resolveUqStack.push(depUqKey);
        }

        let dependencyObject = {
          context: moduleContext,
          rawVersion: dependencyVersion,
          dependencies: {},
        };

        this._resolveNested(moduleContext, (error, nestedDepsTree) => {
          if (error) {
            if (!cbCalled) {
              cbCalled = true;
              cb(error, null);
            }
          } else {
            dependencyObject.dependencies = nestedDepsTree;
            depsTree[moduleContext.name] = dependencyObject;
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
   * @param {Context} moduleContext
   * @param {Function} cb
   * @private
   */
  _resolveNested(moduleContext, cb) {
    this._getModuleConfig(moduleContext, (error, moduleConfig) => {
      if (error) {
        cb(error, null);
        return;
      }

      this._resolve(moduleConfig.config.dependencies || {}, cb);
    })
  }

  /**
   * @param {Context} moduleContext
   * @param {Function} cb
   * @private
   */
  _resolveSingle(moduleContext, cb) {
    this._getModuleDb(moduleContext, (error, moduleDB) => {
      if (error) {
        cb(error, null);
        return;
      }

      console.debug(`Resolving '${moduleContext.name}@${moduleContext.version}'`);

      let matchedVersion = this._strategy.resolve(moduleDB, moduleContext.version);

      if (!matchedVersion) {
        cb(new NoVersionMatchingException(moduleContext, moduleDB), null);
        return;
      }
      
      moduleContext.version = matchedVersion;

      cb(null, moduleContext);
    });
  }

  /**
   * @param {Context} moduleContext
   * @param {Function} cb
   * @private
   */
  _getModuleConfig(moduleContext, cb) {
    let moduleName = moduleContext.name;
    let moduleVersion = moduleContext.version;
    let cacheKey = `${moduleName}@${moduleVersion}`;

    if (this._configCache.hasOwnProperty(cacheKey)) {
      console.debug(`Reading '${moduleName}@${moduleVersion}' module config from cache`);

      cb(null, this._configCache[cacheKey]);
      return;
    }

    console.debug(`Fetching '${moduleName}@${moduleVersion}' module config`);

    this._storage.readModuleConfig(moduleContext, (error, moduleConfig) => {
      if (error) {
        cb(error, null);
        return;
      }

      this._configCache[cacheKey] = moduleConfig;

      cb(null, moduleConfig);
    });
  }

  /**
   * @param {Context} moduleContext
   * @param {Function} cb
   * @private
   */
  _getModuleDb(moduleContext, cb) {
    let moduleName = moduleContext.name;
    
    if (this._dbCache.hasOwnProperty(moduleName)) {
      console.debug(`Reading '${moduleName}' module DB from cache`);

      cb(null, this._dbCache[moduleName]);
      return;
    }

    console.debug(`Looking for '${moduleName}' module DB`);

    this._storage.moduleDbExists(moduleContext, (error, state) => {
      if (error) {
        cb(error, null);
      } else if(!state) {
        cb(new MissingModuleDBException(moduleContext), null);
      } else {
        console.debug(`Fetching '${moduleName}' module DB`);

        this._storage.readModuleDb(moduleContext, (error, moduleDB) => {
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
