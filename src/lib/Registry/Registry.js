/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {WaitFor} from '../Helpers/WaitFor';
import {Dumper} from './Dumper/Dumper';
import {Storage} from './Storage/Storage';
import {S3Driver} from './Storage/Driver/S3Driver';
import {FSDriver as StorageFSDriver} from './Storage/Driver/FSDriver';
import {FSDriver} from './Dumper/Driver/FSDriver';
import {DependenciesResolver} from './Resolver/DependenciesResolver';
import {ModuleInstance} from './ModuleInstance';
import {ModuleConfig} from './ModuleConfig';

export class Registry {
  /**
   * @param {Storage|*} storage
   */
  constructor(storage) {
    this._storage = storage;
  }

  /**
   * @param {String} storagePath
   */
  static createLocalRegistry(storagePath) {
    let storage = new Storage(new StorageFSDriver(storagePath));

    return new Registry(storage);
  }

  /**
   * @param {AWS.S3|*} s3
   * @param {String} bucket
   */
  static createS3Registry(s3, bucket) {
    let storage = new Storage(new S3Driver(s3, bucket));

    return new Registry(storage);
  }

  /**
   * @param {Property|*} property
   * @param {Function} cb
   */
  install(property, cb) {
    let dumpPath = property.path;
    let wait = new WaitFor();

    let cbSent = false;
    let microservices = property.microservices;
    let remaining = microservices.length;

    wait.push(() => {
      return remaining <= 0;
    });

    microservices.forEach((microservice) => {
      let dependencies = microservice.config.dependencies || {};

      for (let dependencyName in dependencies) {
        if (!dependencies.hasOwnProperty(dependencyName)) {
          continue;
        }

        let dependencyRawVersion = dependencies[dependencyName];

        this.installModule(dependencyName, dependencyRawVersion, dumpPath, (error) => {
          if (error) {
            if (!cbSent) {
              cbSent = true;
              cb(error);
            }
          }

          remaining--;
        });
      }
    });

    wait.ready(() => {
      if (!cbSent) {
        cb(null);
      }
    });
  }

  /**
   * @param {String} modulePath
   * @param {Function} cb
   */
  publishModule(modulePath, cb) {
    let moduleConfig = ModuleConfig.createFromModulePath(this._storage, modulePath, (error, moduleConfig) => {
      if (error) {
        cb(error);
        return;
      }

      console.log(`Publishing '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module`);

      let moduleObj = new ModuleInstance(
        moduleConfig.moduleName,
        moduleConfig.moduleVersion,
        '',
        this._storage
      );

      console.log(`Archiving '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module content`);

      moduleObj.load(modulePath, () => {
        console.log(`Uploading '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module to remote registry`);

        moduleObj.upload((error) => {
          if (error) {
            cb(error);
            return;
          }

          console.log(
            `Saving '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module config to remote registry`
          );

          moduleConfig.dump((error) => {
            if (error) {
              cb(error);
              return;
            }

            console.log(`Updating '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module DB`);

            this._storage.updateModuleDb(moduleConfig.moduleName, moduleConfig.moduleVersion, (error) => {
              if (error) {
                console.log(
                  `Module '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' publication failed: ${error}`
                );
              } else {
                console.log(
                  `Module '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' successfully published`
                );
              }

              cb(error);
            });
          });
        });
      });
    });
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleRawVersion
   * @param {String} dumpPath
   * @param {Function} cb
   */
  installModule(moduleName, moduleRawVersion, dumpPath, cb) {
    DependenciesResolver.createUsingRawVersion(
      this._storage,
      null,
      moduleName,
      moduleRawVersion,
      (error, dependenciesResolver) => {
        if (error) {
          cb(error);
          return;
        }

        let dumpDriver = Registry._getFSDumpDriver(dumpPath);
        let dumper = new Dumper(dependenciesResolver, this._storage, dumpDriver);

        dumper.dump(cb);
      }
    );
  }

  /**
   * @param {String} basePath
   * @private
   */
  static _getFSDumpDriver(basePath) {
    return new FSDriver(basePath);
  }
}
