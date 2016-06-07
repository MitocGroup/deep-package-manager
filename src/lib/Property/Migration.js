/**
 * Created by AlexanderC on 6/5/15.
 */

'use strict';

import {FileWalker} from '../Helpers/FileWalker';
import Path from 'path';
import FileSystem from 'fs';
import {InvalidMigrationException} from './Exception/InvalidMigrationException';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../Helpers/AwsRequestSyncStack';
import {WaitFor} from '../Helpers/WaitFor';
import {Hash} from '../Helpers/Hash';

export class Migration {
  /**
   * @param {String} name
   * @param {String} migrationPath
   * @param {String|null} versionPrefix
   */
  constructor(name, migrationPath, versionPrefix = null) {
    this._name = name;
    this._migrationPath = migrationPath;
    this._migration = null;
    this._versionPrefix = versionPrefix;

    this._registry = {
      ensure: (version, onMissingDb) => {
        onMissingDb();
        return true;
      },
      remove: (version) => {}
    };
  }

  /**
   * @returns {String}
   */
  get versionPrefix() {
    return this._versionPrefix;
  }

  /**
   * @returns {MigrationsRegistry|*}
   */
  get registry() {
    return this._registry;
  }

  /**
   * @param {MigrationsRegistry|*} registry
   */
  set registry(registry) {
    this._registry = registry;
  }

  /**
   * @param directories
   * @returns {Model[]}
   */
  static create(...directories) {
    let walker = new FileWalker(FileWalker.RECURSIVE);
    let filter = FileWalker.matchExtensionsFilter(
      FileWalker.skipDotsFilter(),
      Migration.EXTENSION
    );

    let validationSchemas = [];

    for (let i in directories) {
      if (!directories.hasOwnProperty(i)) {
        continue;
      }

      let dir = directories[i];

      if (FileSystem.existsSync(dir)) {
        let versionPrefix = Hash.md5(dir);
        let files = walker.walk(dir, filter);

        for (let j in files) {
          if (!files.hasOwnProperty(j)) {
            continue;
          }

          let migrationFile = files[j];
          let name = Path.basename(migrationFile, `.${Migration.EXTENSION}`);

          validationSchemas.push(new Migration(name, migrationFile, versionPrefix));
        }
      }
    }

    return validationSchemas;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get migrationPath() {
    return this._migrationPath;
  }

  /**
   * @param {*} args
   * @returns {Migration}
   */
  up(...args) {
    return this._exec('up', ...args);
  }

  /**
   * @param {*} args
   * @returns {Migration}
   */
  down(...args) {
    return this._exec('down', ...args);
  }

  /**
   * @param {String} type
   * @param {Property|*} property
   * @param {Function} cb
   * @returns {Migration}
   * @private
   */
  _exec(type, property, cb) {
    let version = this.version;

    let wrappedCb = (error) => {
      console[error ? 'error' : 'log'](`Migration #${version} ${error ? 'FAILED' : 'SUCCEED'}`);

      cb(error);
    };

    try {
      let migration = this.migration;

      new Core.Runtime.Sandbox(() => {
        let ensureResult = this._registry.ensure(version, () => {
          console.debug(`Running migration #${version}`);

          migration[type].bind({
            awsAsync: AwsRequestSyncStack,
            waitFor: WaitFor,
          })(property.provisioning.db, (error) => {
            if (error) {
              this._registry.remove(version);
            }

            wrappedCb(error);
          });
        });

        if (!ensureResult) {
          console.debug(`Skipping migration #${version}`);
          cb(null);
        }
      })
        .fail(wrappedCb)
        .run();
    } catch (e) {
      wrappedCb(e);
    }

    return this;
  }

  /**
   * @returns {String|null}
   */
  get version() {
    let tsVersion = this._name.replace(/^version(\d+)$/i, '$1') || null;

    if (!tsVersion) {
      return null;
    }

    return this._versionPrefix ?
      `${this._versionPrefix}_${tsVersion}` :
      tsVersion;
  }

  /**
   * @returns {Object}
   */
  get migration() {
    if (!this._migration) {
      let migration = require(this._migrationPath);
      let version = this.version;

      if (!version) {
        throw new InvalidMigrationException(this, 'Migration file name should match /^version(\\d+)$/i');
      } else if (typeof migration !== 'object') {
        throw new InvalidMigrationException(this, 'Migration object expected');
      } else if(!migration.hasOwnProperty('up') || typeof migration.up !== 'function') {
        throw new InvalidMigrationException(this, 'Migration.up() should be a function');
      }

      if (!migration.hasOwnProperty('down')) {
        Object.defineProperty(migration, 'down', {
          value: (cb) => {cb(null)},
        });
      }

      this._migration = migration;
    }

    return this._migration;
  }

  /**
   * @returns {String}
   */
  static get EXTENSION() {
    return 'js';
  }
}
