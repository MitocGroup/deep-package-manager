/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {FSDriver} from './Driver/FSDriver';
import {WaitFor} from '../../Helpers/WaitFor';

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
      let remaining = depObjectsStack.length;

      wait.push(() => {
        return remaining <= 0;
      });

      depObjectsStack.forEach((dependencyObj) => {
        this._dumpSingle(dependencyObj.name, dependencyObj.version, (error) => {
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
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   * @private
   */
  _dumpSingle(moduleName, moduleVersion, cb) {
    console.log(`Fetching '${moduleName}@${moduleVersion}' module data`);

    this._storage.readModule(moduleName, moduleVersion, (error, moduleObj) => {
      if (error) {
        cb(error);
        return;
      }

      console.log(`Dumping '${moduleName}@${moduleVersion}' module`);

      this._dumpDriver.dump(moduleObj, cb);
    });
  }

  /**
   * @param {Object} depsTree
   * @returns {{name:*,version:*}[]}
   * @private
   */
  static _collectDepsObjects(depsTree) {
    let depsVector = [];

    depsVector.push({
      name: depsTree.name,
      version: depsTree.version,
    });

    depsTree.dependencies.forEach((nestedDepsTree) => {
      depsVector = depsVector.concat(Dumper._collectDepsObjects(nestedDepsTree));
    });

    return depsVector;
  }
}
