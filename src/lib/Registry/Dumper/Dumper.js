/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {WaitFor} from '../../Helpers/WaitFor';
import {DuplicateModulesException} from './Exception/DuplicateModulesException';

export class Dumper {
  /**
   * @param {DependenciesResolver|*} dependenciesResolver
   * @param {Storage|*} storage
   * @param {AbstractDriver|FSDriver|*} dumpDriver
   */
  constructor(dependenciesResolver, storage, dumpDriver) {
    this._dependenciesResolver = dependenciesResolver;
    this._storage = storage;
    this._dumpDriver = dumpDriver;
  }

  /**
   * @returns {DependenciesResolver|*}
   */
  get dependenciesResolver() {
    return this._dependenciesResolver;
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {AbstractDriver|FSDriver|*}
   */
  get dumpDriver() {
    return this._dumpDriver;
  }

  /**
   * @param {Function} cb
   */
  dump(cb) {
    this._dependenciesResolver.resolve((error, depsTree) => {
      if (error) {
        cb(error);
        return;
      }

      let cbCalled = false;
      let wait = new WaitFor();
      let depObjectsStack = Dumper._collectDepsObjects(depsTree);

      try {
        this._checkForDuplicates(depObjectsStack);
      } catch (error) {
        cb(error);
        return;
      }

      let remaining = depObjectsStack.length;

      wait.push(() => {
        return remaining <= 0;
      });

      depObjectsStack.forEach((dependencyObj) => {
        this._dumpSingle(dependencyObj.context, (error) => {
          if (error) {
            if (!cbCalled) {
              cbCalled = true;
              cb(error);
            }
          }

          remaining--;
        });
      });

      wait.ready(() => {
        if (!cbCalled) {
          cb(null);
        }
      });
    });
  }

  /**
   * @param {Object} depObjectsStack
   * @private
   */
  _checkForDuplicates(depObjectsStack) {
    let depStack = {};
    let duplicatesStack = {};

    depObjectsStack.forEach((dependencyObj) => {
      let depContext = dependencyObj.context;

      depStack[depContext.name] = depStack[depContext.name] || [];
      depStack[depContext.name].push(depContext.version);
    });

    for (let depName in depStack) {
      if (!depStack.hasOwnProperty(depName)) {
        continue;
      }

      let depVersions = depStack[depName];

      if (depVersions.length > 1) {
        duplicatesStack[depName] = depVersions;
      }
    }

    if (Object.keys(duplicatesStack).length > 0) {
      throw new DuplicateModulesException(duplicatesStack);
    }
  }

  /**
   * @param {Context} moduleContext
   * @param {Function} cb
   * @private
   */
  _dumpSingle(moduleContext, cb) {
    let moduleName = moduleContext.name;
    let moduleVersion = moduleContext.version;

    this._dumpDriver.hasToDump(moduleContext, (error, hasToDump) => {
      if (error) {
        cb(error);
        return;
      } else if (!hasToDump) {
        console.debug(`Module '${moduleName}@${moduleVersion}' has been already dumped. Skipping...`);

        cb(null);
        return;
      }

      console.debug(`Fetching '${moduleName}@${moduleVersion}' module data`);

      this._storage.readModule(moduleContext, (error, moduleObj) => {
        if (error) {
          cb(error);
          return;
        }

        console.debug(`Dumping '${moduleName}@${moduleVersion}' module`);

        this._dumpDriver.dump(moduleObj, cb);
      });
    });
  }

  /**
   * @param {Object} depsTree
   * @returns {{name:*,version:*}[]}
   * @private
   */
  static _collectDepsObjects(depsTree) {
    let depsVector = [];

    // @todo: return circular deps?
    // although these are removed on Dumper._removeDepsVectorDuplicates()
    if (depsTree._isCircular) {
      return depsVector;
    }

    depsVector.push({
      context: depsTree.context
    });

    let deps = depsTree.dependencies || {};

    for (let depName in deps) {
      if (!deps.hasOwnProperty(depName)) {
        continue;
      }

      let nestedDepsTree = deps[depName];

      depsVector = depsVector.concat(Dumper._collectDepsObjects(nestedDepsTree));
    }

    return Dumper._removeDepsVectorDuplicates(depsVector);
  }

  /**
   * @param {{context:*}[]} depsVector
   * @returns {{context:*}[]}
   * @private
   */
  static _removeDepsVectorDuplicates(depsVector) {
    let storageKeys = [];
    let cleanVector = [];

    depsVector.forEach((depObj) => {
      let storageKey = depObj.context.toString();

      if (storageKeys.indexOf(storageKey) === -1) {
        storageKeys.push(storageKey);
        cleanVector.push(depObj);
      }
    });

    return cleanVector;
  }
}
