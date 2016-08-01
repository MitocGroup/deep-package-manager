/**
 * Created by AlexanderC on 1/27/16.
 */

'use strict';

import Core from 'deep-core';
import FS from 'deep-fs';
import {S3Service} from '../Provisioning/Service/S3Service';

export class MigrationsRegistry {
  /**
   * @param {FS.RegistryInstance|*} registry
   */
  constructor(registry) {
    this._registry = registry;
    
    this._migrations = [];
  }

  /**
   * @param {Property|*} property
   * @returns {MigrationsRegistry}
   */
  static create(property) {
    return new MigrationsRegistry(MigrationsRegistry._createRegistry(property));
  }

  /**
   * @param {String} version
   * @param {Function} onMissingDb
   * @returns {Boolean}
   */
  ensure(version, onMissingDb) {
    if (!this.has(version)) {
      this.register(version);

      onMissingDb();

      return true;
    }

    return false;
  }

  /**
   * @param {String} version
   * @returns {MigrationsRegistry}
   */
  remove(version) {
    if (this.has(version)) {
      let i = this._migrations.indexOf(version);

      this._migrations.splice(i, 1);
    }

    return this;
  }

  /**
   * @param {String} version
   * @returns {Boolean}
   */
  has(version) {
    return this._migrations.indexOf(version) !== -1;
  }

  /**
   * @param {String} version
   * @returns {MigrationsRegistry}
   */
  register(version) {
    this._migrations.push(version);

    return this;
  }

  /**
   * @returns {String[]}
   */
  get migrations() {
    return this._migrations;
  }

  /**
   * @param {String[]} migrations
   */
  set migrations(migrations) {
    this._migrations = migrations;
  }

  /**
   * @param {Function} cb
   * @returns {MigrationsRegistry}
   */
  load(cb) {
    this._registry.exists(MigrationsRegistry.REGISTRY_KEY, (error, exists) => {
      if (error) {
        cb(error);
        return;
      }

      if (exists) {
        this._registry.read(MigrationsRegistry.REGISTRY_KEY, (error, migrations) => {
          if (error) {
            cb(error);
            return;
          }

          this._migrations = migrations;

          cb(null);
        });

        return;
      }

      cb(null);
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @returns {MigrationsRegistry}
   */
  dump(cb) {
    this._registry.write(MigrationsRegistry.REGISTRY_KEY, this._migrations, cb);

    return this;
  }

  /**
   * @param {Property|*} property
   * @returns {FS.RegistryInstance}
   * @private
   */
  static _createRegistry(property) {
    return new FS.RegistryInstance(
      property.provisioning.s3,
      MigrationsRegistry._getSystemBucket(property)
    );
  }

  /**
   * @param {Property|*} property
   * @returns {String}
   * @private
   */
  static _getSystemBucket(property) {
    return property.config
      .provisioning[Core.AWS.Service.SIMPLE_STORAGE_SERVICE]
      .buckets[S3Service.PRIVATE_BUCKET]
      .name;
  }

  /**
   * @returns {String}
   */
  static get REGISTRY_KEY() {
    return '__migrations__';
  }
}
