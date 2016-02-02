/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import fs from 'fs';
import path from 'path';
import JsonFile from 'jsonfile';
import {AbstractService} from '../Provisioning/Service/AbstractService';
import {S3Service} from '../Provisioning/Service/S3Service';

/**
 * Application configuration loader
 */
export class DeployConfig {
  /**
   * @param {Property|*} property
   */
  constructor(property) {
    this._property = property;

    this._baseHash = this._generateBaseHash();
  }

  /**
   * @returns {String}
   * @private
   */
  _generateBaseHash() {
    return AbstractService.generateUniqueResourceHash(
      this._property.config.awsAccountId,
      this._property.identifier
    );
  }

  /**
   * @returns {String}
   */
  get baseHash() {
    return this._baseHash;
  }

  /**
   * @returns {Property|*}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._property.config;
  }

  /**
   * @returns {String}
   */
  get configFile() {
    let deployEnv = this._property._config.env;

    return path.join(
      this._property.path,
      `.${this.baseHash}.${deployEnv}.deeploy.json`
    );
  }

  /**
   * @returns {String}
   */
  get configBucket() {
    if (!this._property.config.hasOwnProperty('provisioning') ||
     !this._property.config.provisioning.hasOwnProperty('s3') ||
      !this._property.config.provisioning.s3.hasOwnProperty('buckets')) {

      return null;
    }

    return this._property.config.provisioning.s3.buckets[S3Service.SYSTEM_BUCKET].name;
  }

  /**
   * @returns {Object|propertyInstance.provisioning.s3|{config}|defaultConfig.s3|{}|extendObject.s3}
   * @private
   */
  get _s3() {
    return this._property.provisioning.s3;
  }

  /**
   * @param {Function} cb
   * @param {String} bucket
   */
  completeDump(cb, bucket = null) {
    this.dump();

    this.dumpS3(() => {
      cb();
    }, bucket);
  }

  /**
   * @param {Function} cb
   * @param {String} bucket
   */
  tryLoadConfig(cb, bucket = null) {
    if (!this.configExists) {
      this.trySyncS3Dump((error) => {
        if (!error) {
          this.tryReadFromDump();
        }

        cb();
      }, bucket);
    } else {
      this.tryReadFromDump();

      cb();
    }
  }

  /**
   * @param {Function} cb
   * @param {String} bucket
   */
  trySyncS3Dump(cb, bucket = null) {
    bucket = bucket || this.configBucket;

    if (!bucket) {
      cb(new Error('Missing deploy config bucket in provisioning config'));
      return;
    }

    let payload = {
      Bucket: bucket,
      Key: path.basename(this.configFile),
    };

    this._s3.getObject(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      fs.writeFile(this.configFile, data.Body.toString(), (error) => {
        cb(error);
      });
    });
  }

  /**
   * @param {Function} cb
   * @param {String} bucket
   */
  dumpS3(cb, bucket = null) {
    bucket = bucket || this.configBucket;

    if (!bucket) {
      cb(new Error('Missing deploy config bucket in provisioning config'));
      return;
    }

    let payload = {
      Bucket: bucket,
      Key: path.basename(this.configFile),
      Body: JSON.stringify(this.config),
    };

    this._s3.putObject(payload, (error) => {
      cb(error);
    });
  }

  /**
   * @returns {DeployConfig}
   */
  dump() {
    JsonFile.writeFileSync(this.configFile, this.config);

    return this;
  }

  /**
   * @returns {Boolean}
   */
  get configExists() {
    return fs.existsSync(this.configFile);
  }

  /**
   * @returns {DeployConfig}
   */
  tryReadFromDump() {
    if (!this.configExists) {
      return this;
    }

    let propertyConfigSnapshot = JsonFile.readFileSync(this.configFile);

    return this.updateConfig(propertyConfigSnapshot);
  }

  /**
   * @param {Object} propertyConfigSnapshot
   * @returns {DeployConfig}
   */
  updateConfig(propertyConfigSnapshot) {
    // keep initial deployId
    let deployId = this._property.deployId;

    this._property._config = propertyConfigSnapshot;
    this._property._config.deployId = deployId;

    this._property._provisioning.injectConfig(
      this._property._config.provisioning
    );

    return this;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_ENV() {
    return ['dev', 'stage', 'test', 'prod'];
  }
}
