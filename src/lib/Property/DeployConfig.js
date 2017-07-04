/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import fs from 'fs';
import path from 'path';
import JsonFile from 'jsonfile';
import {AbstractService} from '../Provisioning/Service/AbstractService';
import {S3Service} from '../Provisioning/Service/S3Service';
import {SharedAwsConfig} from '../Helpers/SharedAwsConfig';

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
   * @param {String} baseHash
   */
  set baseHash(baseHash) {
    this._baseHash = baseHash;
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
      DeployConfig.generateConfigFilename(this.baseHash, deployEnv)
    );
  }

  /**
   * @param {String} baseHash
   * @param {String} env
   * @returns {String}
   */
  static generateConfigFilename(baseHash, env) {
    return `.${baseHash}.${env}.provisioning.json`;
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

    return this._property.config.provisioning.s3.buckets[S3Service.PRIVATE_BUCKET].name;
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
          this.tryReadFromDump(cb);
        } else {
          cb();
        }
      }, bucket);
    } else {
      this.tryReadFromDump(cb);
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

      try {
        let configDump = JSON.parse(data.Body.toString());

        this._extendCleanConfig(configDump);

        fs.writeFile(this.configFile, JSON.stringify(configDump, null, '  '), (error) => {
          cb(error);
        });
      } catch(e) {
        cb(new Error('Broken s3 config dump. Cannot parse s3 config.'));
      }
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
      Body: JSON.stringify(this._cleanDeployConfig),
    };

    this._s3.putObject(payload, (error) => {
      cb(error);
    });
  }

  /**
   * @returns {DeployConfig}
   *
   * @todo dump locally without aws credentials 
   *       after property config fixed
   */
  dump() {
    JsonFile.writeFileSync(this.configFile, this.config);

    return this;
  }

  /**
   * @returns {*}
   */
  get _cleanDeployConfig() {
    let config = JSON.parse(JSON.stringify(this.config));
    
    // ensure credentials remains safe
    delete config.aws;
     
    return config;
  }

  /**
   * @param {Object} configDump
   * @returns {DeployConfig}
   * @private
   */
  _extendCleanConfig(configDump) {
    if (!configDump.aws) {
      configDump.aws = this._property.config.aws || new SharedAwsConfig().choose();
    }

    return this;
  }

  /**
   * @returns {Boolean}
   */
  get configExists() {
    return fs.existsSync(this.configFile);
  }

  /**
   * @param {Function} cb
   * @returns {DeployConfig}
   */
  tryReadFromDump(cb = () => {}) {
    if (!this.configExists) {
      cb();
      return this;
    }

    let propertyConfigSnapshot = JsonFile.readFileSync(this.configFile);

    return this.updateConfig(propertyConfigSnapshot, cb);
  }

  /**
   * @param {Object} propertyConfigSnapshot
   * @param {Function} cb
   * @returns {DeployConfig}
   */
  updateConfig(propertyConfigSnapshot, cb = () => {}) {
    let currentRegion = this._property._config.awsRegion;
    let snapshotRegion = propertyConfigSnapshot.awsRegion;

    if (propertyConfigSnapshot.env === this._property._config.env &&
      propertyConfigSnapshot.appIdentifier === this._property._config.appIdentifier &&
      snapshotRegion !== currentRegion) {

      let message = `App ${this.baseHash} is already deployed in ${snapshotRegion} region.
If you want to deploy it into ${currentRegion} you have to undeploy it from ${snapshotRegion}.`;

      cb(new Error(message.replace(/\n/g, '')));

      return this;
    }

    // keep initial deployId
    let deployId = this._property.deployId;

    // keep apiVersion from deeploy.json file
    let apiVersion = this._property._config.apiVersion;

    this._property._config = propertyConfigSnapshot;
    this._property._config.deployId = deployId;
    this._property._config.apiVersion = apiVersion;

    this._property._provisioning.injectConfig(
      this._property._config.provisioning
    );

    cb();

    return this;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_ENV() {
    return ['dev', 'stage', 'test', 'prod'];
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_API_VERSION() {
    return 'v1';
  }
}
