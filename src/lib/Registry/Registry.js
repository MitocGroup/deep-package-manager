/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {WaitFor} from '../Helpers/WaitFor';
import {Dumper} from './Dumper/Dumper';
import {Storage} from './Storage/Storage';
import {S3Driver} from './Storage/Driver/S3Driver';
import {FSDriver as StorageFSDriver} from './Storage/Driver/FSDriver';
import {ApiDriver as ApiDriverDriver} from './Storage/Driver/ApiDriver';
import {PropertyAwareFSDriver} from './Dumper/Driver/PropertyAwareFSDriver';
import {FSDriver} from './Dumper/Driver/FSDriver';
import {DependenciesResolver} from './Resolver/DependenciesResolver';
import {ModuleInstance} from './ModuleInstance';
import {ModuleConfig} from './ModuleConfig';
import {Server} from './Local/Server';

export class Registry {
  /**
   * @param {Storage|*} storage
   */
  constructor(storage) {
    this._storage = storage;
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @param {String} repositoryPath
   * @param {String} baseHost
   * @param {Function} cb
   * @param {Boolean} cached
   * @returns {Server|*}
   */
  static startApiServerAndCreateRegistry(repositoryPath, baseHost, cb, cached = false) {
    let server = new Server(repositoryPath);

    server.start((error) => {
      if (error) {
        cb(error, null);
        return;
      }

      Registry.createApiRegistry(baseHost, (error, registry) => {
        if (error) {
          server.stop(() => {
            cb(error, null);
          });

          return;
        }

        cb(null, registry);
      }, cached);
    });

    return server;
  }

  /**
   * @param {String} baseHost
   * @param {Function} cb
   * @param {Boolean} cached
   */
  static createApiRegistry(baseHost, cb, cached = false) {
    ApiDriverDriver.autoDiscover(baseHost, (error, apiDriver) => {
      if (error) {
        cb(error, null);
        return;
      }

      try {
        cb(null, new Registry(new Storage(apiDriver)));
      } catch (error) {
        cb(error, null);
      }
    }, cached);
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
   * @param {String} prefix
   */
  static createS3Registry(s3, bucket, prefix = '') {
    let storage = new Storage(new S3Driver(s3, bucket, prefix));

    return new Registry(storage);
  }

  /**
   * @param {Property|*} property
   * @param {Function} cb
   * @param {String[]|null} allowedMicroservices
   */
  install(property, cb, allowedMicroservices = null) {
    let dumpPath = property.path;
    let wait = new WaitFor();

    let cbSent = false;
    let microservices = property.microservices;
    let remaining = microservices.length;

    wait.push(() => {
      return remaining <= 0;
    });

    microservices.forEach((microservice) => {
      if (allowedMicroservices &&
        Array.isArray(allowedMicroservices) &&
        allowedMicroservices.indexOf(microservice.identifier) === -1) {

        remaining--;
        return;
      }

      let dependencies = microservice.config.dependencies || {};

      if (Object.keys(dependencies).length <= 0) {
        remaining--;
        return;
      }

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
        }, property);
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

      console.debug(`Publishing '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module`);

      let moduleObj = new ModuleInstance(
        moduleConfig.moduleName,
        moduleConfig.moduleVersion,
        '',
        this._storage
      );

      console.debug(`Archiving '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module content`);

      moduleObj.load(modulePath, () => {
        console.debug(`Uploading '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module to remote registry`);

        moduleObj.upload((error) => {
          if (error) {
            cb(error);
            return;
          }

          console.debug(
            `Saving '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module config to remote registry`
          );

          moduleConfig.dump((error) => {
            if (error) {
              cb(error);
              return;
            }

            console.debug(`Updating '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' module DB`);

            this._storage.updateModuleDb(moduleConfig.moduleName, moduleConfig.moduleVersion, (error) => {
              if (error) {
                console.error(
                  `Module '${moduleConfig.moduleName}@${moduleConfig.moduleVersion}' publication failed: ${error}`
                );
              } else {
                console.debug(
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
   * @param {Property|Instance|null|*} property
   *
   * @todo: Remove property argument?
   */
  installModule(moduleName, moduleRawVersion, dumpPath, cb, property = null) {
    console.debug(`Installing '${moduleName}@${moduleRawVersion}' module into '${dumpPath}'`);

    DependenciesResolver.createUsingRawVersion(
      this._storage,
      null,
      moduleName,
      moduleRawVersion,
      (error, dependenciesResolver) => {
        if (error) {
          console.error(`Module '${moduleName}@${moduleRawVersion}' installation failed: ${error}`);
          cb(error);
          return;
        }

        let dumpDriver = property ?
          Registry._getPropertyAwareFSDumpDriver(dumpPath, property) :
          Registry._getFSDumpDriver(dumpPath);

        let dumper = new Dumper(dependenciesResolver, this._storage, dumpDriver);

        dumper.dump((error) => {
          if (error) {
            console.error(`Module '${moduleName}@${moduleRawVersion}' installation failed: ${error}`);
          } else {
            console.debug(`Module '${moduleName}@${moduleRawVersion}' successfully installed`);
          }

          cb(error);
        });
      }
    );
  }

  /**
   * @param {String} basePath
   * @param {Property|Instance|*} property
   * @returns {PropertyAwareFSDriver|*}
   * @private
   */
  static _getPropertyAwareFSDumpDriver(basePath, property) {
    let driver = new PropertyAwareFSDriver(basePath);
    driver.property = property;

    return driver;
  }

  /**
   * @param {String} basePath
   * @returns {FSDriver|*}
   * @private
   */
  static _getFSDumpDriver(basePath) {
    return new FSDriver(basePath);
  }
}
