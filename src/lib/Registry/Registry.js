/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {WaitFor} from '../Helpers/WaitFor';
import {Dumper} from './Dumper/Dumper';
import {Storage} from './Storage/Storage';
import {S3Driver} from './Storage/Driver/S3Driver';
import {FSDriver} from './Dumper/Driver/FSDriver';
import {DependenciesResolver} from './Resolver/DependenciesResolver';

export class Registry {
  /**
   * @param {Storage|*} storage
   */
  constructor(storage) {
    this._storage = storage;
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
      if (cbSent) {
        return;
      }

      cb();
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

        let dumpDriver = this._getFSDumpDriver(dumpPath);
        let dumper = new Dumper(dependenciesResolver, this._storage, dumpDriver);

        dumper.dump(cb);
      }
    );
  }

  /**
   * @param {String} basePath
   * @private
   */
  _getFSDumpDriver(basePath) {
    return new FSDriver(basePath);
  }
}
