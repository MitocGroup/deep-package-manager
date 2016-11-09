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
import {GitHubDriver} from './Storage/Driver/GitHubDriver';
import {ComplexDriver} from './Storage/Driver/ComplexDriver';
import {PropertyAwareFSDriver} from './Dumper/Driver/PropertyAwareFSDriver';
import {FSDriver} from './Dumper/Driver/FSDriver';
import {DependenciesResolver} from './Resolver/DependenciesResolver';
import {ModuleInstance} from './Module/ModuleInstance';
import {ModuleConfig} from './ModuleConfig';
import {Server} from './Local/Server';
import {Context} from './Context/Context';
import {OptimisticStrategy} from './Resolver/Strategy/OptimisticStrategy';

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
    let driver = new ComplexDriver(new GitHubDriver());
    let storage = new Storage(driver);

    ApiDriverDriver.autoDiscover(baseHost, (error, apiDriver) => {
      if (error) {
        console.warn(`DEEP registry is not available on ${baseHost}`);
      } else {
        driver.addDriver(apiDriver);
      }
    
      try {
        cb(null, new Registry(storage));
      } catch (error) {
        cb(error, null);
      }
    }, cached);
  }


  /**
   * @param {String} storagePath
   * @returns {Registry}
   */
  static createRegistry(storagePath) {
    let driver = new ComplexDriver(
      new StorageFSDriver(storagePath),
      new GitHubDriver()
    );

    let storage = new Storage(driver);

    return new Registry(storage);
  }

  /**
   * @param {AWS.S3|*} s3
   * @param {String} bucket
   * @param {String} prefix
   * @returns {Registry}
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
        let moduleContext = Context.create(dependencyName, dependencyRawVersion);

        this.installModule(moduleContext, dumpPath, (error) => {
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
    ModuleConfig.createFromModulePath(this._storage, modulePath, (error, moduleConfig) => {
      if (error) {
        cb(error);
        return;
      }

      console.debug(`Publishing '${moduleConfig.context}' module`);

      let moduleObj = new ModuleInstance(
        moduleConfig.context,
        '',
        this._storage
      );

      console.debug(`Archiving '${moduleConfig.context}' module content`);

      moduleObj.load(modulePath, () => {
        console.debug(`Uploading '${moduleConfig.context}' module to remote registry`);

        moduleObj.upload((error) => {
          if (error) {
            cb(error);
            return;
          }

          console.debug(
            `Saving '${moduleConfig.context}' module config to remote registry`
          );

          moduleConfig.dump((error) => {
            if (error) {
              cb(error);
              return;
            }

            console.debug(`Updating '${moduleConfig.context}' module DB`);

            this._storage.updateModuleDb(moduleConfig.context, (error) => {
              if (error) {
                console.error(
                  `Module '${moduleConfig.context}' publication failed: ${error}`
                );
              } else {
                console.debug(
                  `Module '${moduleConfig.context}' successfully published`
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
   * @param {Context} moduleContext
   * @param {String} dumpPath
   * @param {Function} cb
   * @param {Property|Instance|null|*} property
   *
   * @todo: Remove property argument?
   */
  installModule(moduleContext, dumpPath, cb, property = null) {
    console.debug(`Installing '${moduleContext}' module into '${dumpPath}'`);

    DependenciesResolver.createUsingRawVersion(
      this._storage,
      new OptimisticStrategy(),
      moduleContext,
      (error, dependenciesResolver) => {
        if (error) {
          console.error(`Module '${moduleContext}' installation failed: ${error}`);
          cb(error);
          return;
        }

        let dumpDriver = property ?
          Registry._getPropertyAwareFSDumpDriver(dumpPath, property) :
          Registry._getFSDumpDriver(dumpPath);

        let dumper = new Dumper(dependenciesResolver, this._storage, dumpDriver);

        dumper.dump((error) => {
          if (error) {
            console.error(`Module '${moduleContext}' installation failed: ${error}`);
          } else {
            console.log(`Module '${moduleContext}' successfully installed`);
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
