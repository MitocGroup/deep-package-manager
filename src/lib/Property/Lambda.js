/**
 * Created by AlexanderC on 6/2/15.
 */

'use strict';

import StringUtils from 'underscore.string';
import Archiver from 'archiver';
import FileSystem from 'fs';
import {FailedLambdaUploadException} from './Exception/FailedLambdaUploadException';
import {FailedUploadingLambdaToS3Exception} from './Exception/FailedUploadingLambdaToS3Exception';
import {AwsRequestSyncStack} from '../Helpers/AwsRequestSyncStack';
import {WaitFor} from '../Helpers/WaitFor';
import Path from 'path';
import {Frontend} from './Frontend';
import Core from 'deep-core';
import JsonFile from 'jsonfile';
import {S3Service} from '../Provisioning/Service/S3Service';
import Mime from 'mime';
import FileSystemExtra from 'fs-extra';
import {InvalidConfigException} from './Exception/InvalidConfigException';
import {Exception} from '../Exception/Exception';

/**
 * Lambda instance
 */
export class Lambda {
  /**
   * @param {Property} property
   * @param {String} microserviceIdentifier
   * @param {String} identifier
   * @param {String} name
   * @param {Object} execRole
   * @param {String} path
   */
  constructor(property, microserviceIdentifier, identifier, name, execRole, path) {
    this._property = property;
    this._microserviceIdentifier = microserviceIdentifier;
    this._identifier = identifier;
    this._name = name;
    this._execRole = execRole;
    this._path = StringUtils.rtrim(path, '/');
    this._outputPath = StringUtils.rtrim(property.path, '/');
    this._zipPath = `${this._outputPath}/${microserviceIdentifier}_lambda_${identifier}.zip`;

    this._memorySize = Lambda.DEFAULT_MEMORY_LIMIT;
    this._timeout = Lambda.DEFAULT_TIMEOUT;
    this._runtime = Lambda.DEFAULT_RUNTIME;

    this._uploadedLambda = null;
  }

  /**
   * @param {Object} propertyConfig
   * @return {Object}
   */
  createConfig(propertyConfig) {
    let config = Frontend.createConfig(propertyConfig);

    config.microserviceIdentifier = this.microserviceIdentifier;
    config.awsAccountId = propertyConfig.awsAccountId;
    config.appIdentifier = propertyConfig.appIdentifier;
    config.timestamp = (new Date()).getTime();
    config.buckets = S3Service.fakeBucketsConfig(propertyConfig.appIdentifier);
    config.tablesNames = [];

    //config.cacheDsn = '';

    if (propertyConfig.provisioning) {
      config.buckets = propertyConfig.provisioning[Core.AWS.Service.SIMPLE_STORAGE_SERVICE].buckets;
      config.tablesNames = propertyConfig.provisioning[Core.AWS.Service.DYNAMO_DB].tablesNames;

      //config.cacheDsn = propertyConfig.provisioning[Core.AWS.Service.ELASTIC_CACHE].dsn;
    }

    for (let microserviceIdentifier in propertyConfig.microservices) {
      if (!propertyConfig.microservices.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = propertyConfig.microservices[microserviceIdentifier];

      config.microservices[microserviceIdentifier].parameters = microservice.parameters.backend;
    }

    return config;
  }

  /**
   * @returns {String}
   */
  get microserviceIdentifier() {
    return this._microserviceIdentifier;
  }

  /**
   * @returns {String}
   */
  get awsAccountId() {
    return this._property.config.awsAccountId;
  }

  /**
   * @returns {String}
   */
  get appIdentifier() {
    return this._property.identifier;
  }

  /**
   * @returns {String}
   */
  get region() {
    return this._property.provisioning.lambda.config.region;
  }

  /**
   * @returns {String}
   */
  get functionName() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get arn() {
    return `arn:aws:lambda:${this.region}:${this.awsAccountId}:function:${this.functionName}`;
  }

  /**
   * @returns {String}
   */
  get runtime() {
    return this._runtime;
  }

  /**
   * @param {String} runtime
   */
  set runtime(runtime) {
    this._runtime = runtime;
  }

  /**
   * @returns {Number}
   */
  get timeout() {
    return this._timeout;
  }

  /**
   * @param {Number} timeout
   */
  set timeout(timeout) {
    this._timeout = timeout;
  }

  /**
   * @returns {Number}
   */
  get memorySize() {
    return this._memorySize;
  }

  /**
   * @param {Number} memorySize
   */
  set memorySize(memorySize) {
    this._memorySize = memorySize;
  }

  /**
   * @returns {String}
   */
  get identifier() {
    return this._identifier;
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {String}
   */
  get outputPath() {
    return this._outputPath;
  }

  /**
   * @returns {String}
   */
  get zipPath() {
    return this._zipPath;
  }

  /**
   * @returns {null|Object}
   */
  get uploadedLambda() {
    return this._uploadedLambda;
  }

  /**
   * @param {Function} callback
   * @returns {Lambda}
   */
  update(callback) {
    this.pack().ready(function() {
      this.updateCode().ready(callback);
    }.bind(this));

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Lambda}
   */
  deploy(callback) {
    this.pack().ready(function() {
      console.log(`${new Date().toTimeString()} Lambda ${this._identifier} packing is ready`);

      this.upload().ready(callback);
    }.bind(this));

    return this;
  }

  /**
   * @param {String} path
   * @param {String} outputFile
   * @returns {WaitFor}
   */
  static createPackage(path, outputFile = null) {
    outputFile = outputFile || `${path}.zip`;

    let wait = new WaitFor();
    let ready = false;
    let output = FileSystem.createWriteStream(outputFile);
    let archive = Archiver('zip');

    output.on('close', function() {
      ready = true;
    }.bind(this));

    wait.push(function() {
      return ready;
    }.bind(this));

    archive.pipe(output);

    archive
      .directory(path, false)
      .finalize();

    return wait;
  }

  /**
   * @param {String} lambdaPath
   * @param {String} packageFile
   * @returns {WaitFor}
   */
  static injectPackageConfig(lambdaPath, packageFile) {
    let wait = new WaitFor();
    let ready = false;

    let configFile = Path.join(lambdaPath, Lambda.CONFIG_FILE);

    if (!FileSystem.existsSync(packageFile)) {
      throw new InvalidConfigException(`Package file not found in ${packageFile}!`);
    }

    if (!FileSystem.existsSync(configFile)) {
      throw new InvalidConfigException(`Config file not found in ${configFile}!`);
    }

    // @todo: remove this temporary hook by rewriting it in a native way
    require('child_process').exec(
      `cd ${Path.dirname(configFile)} && zip -r ${packageFile} ${Lambda.CONFIG_FILE}`,
      function(error, stdout, stderr) {
        if (error !== null) {
          throw new Exception(`Error while adding ${Lambda.CONFIG_FILE} to lambda build: ${error}`);
        }

        ready = true;
      }.bind(this)
    );

    wait.push(function() {
      return ready;
    }.bind(this));

    return wait;
  }

  /**
   * @returns {WaitFor}
   */
  pack() {
    console.log(`${new Date().toTimeString()} Start packing lambda ${this._identifier}`);

    this.persistConfig();

    let buildFile = `${this._path}.zip`;

    if (FileSystem.existsSync(buildFile)) {
      console.log(`${new Date().toTimeString()} Lambda prebuilt in ${buildFile}`);

      FileSystemExtra.copySync(buildFile, this._zipPath);

      return Lambda.injectPackageConfig(this._path, this._zipPath);
    } else {
      return Lambda.createPackage(this._path, this._zipPath);
    }
  }

  /**
   * @returns {AwsRequestSyncStack}
   */
  updateCode() {
    return this.upload(true);
  }

  /**
   * @param {Boolean} update
   * @returns {AwsRequestSyncStack}
   */
  upload(update = false) {
    console.log(`${new Date().toTimeString()} Start uploading lambda ${this._identifier}`);

    let lambda = this._property.provisioning.lambda;
    let s3 = this._property.provisioning.s3;
    let tmpBucket = this._property.config.provisioning.s3.buckets[S3Service.TMP_BUCKET].name;

    let objectKey = this._zipPath.split('/').pop();

    let s3Params = {
      Bucket: tmpBucket,
      Key: objectKey,
      Body: FileSystem.readFileSync(this._zipPath),
      ContentType: Mime.lookup(this._zipPath),
    };

    let syncStack = new AwsRequestSyncStack();

    syncStack.push(s3.putObject(s3Params), function(error, data) {
      if (error) {
        throw new FailedUploadingLambdaToS3Exception(objectKey, tmpBucket, error);
      }

      let request = null;

      console.log(`${new Date().toTimeString()} Lambda ${this._identifier} uploaded`);

      if (update) {
        let params = {
          S3Bucket: tmpBucket,
          S3Key: objectKey,
          S3ObjectVersion: data.VersionId,
          FunctionName: this.functionName,
        };

        request = lambda.updateFunctionCode(params);
      } else {
        let params = {
          Code: {
            S3Bucket: tmpBucket,
            S3Key: objectKey,
            S3ObjectVersion: data.VersionId,
          },
          FunctionName: this.functionName,
          Handler: this.handler,
          Role: this._execRole.Arn,
          Runtime: this._runtime,
          MemorySize: this._memorySize,
          Timeout: this._timeout,
        };

        request = lambda.createFunction(params);
      }

      syncStack.level(1).push(request, function(error, data) {
        if (error) {
          // @todo: remove this hook
          if (Lambda.isErrorFalsePositive(error)) {
            // @todo: get rid of this hook...
            this._uploadedLambda = this.createConfigHookData;

            return;
          }

          throw new FailedLambdaUploadException(this, error);
        }

        this._uploadedLambda = data;
      }.bind(this));
    }.bind(this));

    return syncStack.join();
  }

  /**
   * @todo: remove this after fixing AWS issue [see this.isErrorFalsePositive()]
   *
   * @returns {Object}
   */
  get createConfigHookData() {
    return {
      CodeSize: 0,
      Description: '',
      FunctionArn: this.arn,
      FunctionName: this.functionName,
      Handler: this.handler,
      LastModified: new Date().toISOString(),
      MemorySize: this._memorySize,
      Role: this._execRole.Arn,
      Runtime: this._runtime,
      Timeout: this._timeout,
    };
  }

  /**
   * @todo: temporary fix of the unexpected result (sorry for this guys :/)
   *
   * @param {Object} error
   * @returns {Boolean}
   */
  static isErrorFalsePositive(error) {
    return (error.code === 'ResourceConflictException' || error.code === 'EntityAlreadyExists')
      && error.statusCode === 409;
  }

  /**
   * @returns {Lambda}
   */
  persistConfig() {
    JsonFile.writeFileSync(
      `${this.path}/_config.json`,
      this.createConfig(this._property.config)
    );

    return this;
  }

  /**
   * @returns {String}
   */
  get handler() {
    return this._runtime === 'nodejs'
      ? 'bootstrap.handler'
      : 'bootstrap.handler::handle';
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE() {
    return '_config.json';
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_TIMEOUT() {
    return 60;
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_MEMORY_LIMIT() {
    return 128;
  }

  /**
   * @returns {Number}
   */
  static get MAX_TIMEOUT() {
    return 60;
  }

  /**
   * @returns {String[]}
   */
  static get RUNTIMES() {
    return ['nodejs', 'java8'];
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_RUNTIME() {
    return Lambda.RUNTIMES[0];
  }
}
