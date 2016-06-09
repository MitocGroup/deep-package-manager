/**
 * Created by AlexanderC on 6/2/15.
 */

'use strict';

import Archiver from 'archiver';
import FileSystem from 'fs';
import {FailedLambdaUploadException} from './Exception/FailedLambdaUploadException';
import {FailedUploadingLambdaToS3Exception} from './Exception/FailedUploadingLambdaToS3Exception';
import {AwsRequestSyncStack} from '../Helpers/AwsRequestSyncStack';
import {WaitFor} from '../Helpers/WaitFor';
import {Exec} from '../Helpers/Exec';
import Path from 'path';
import {Frontend} from './Frontend';
import Core from 'deep-core';
import JsonFile from 'jsonfile';
import {S3Service} from '../Provisioning/Service/S3Service';
import {SQSService} from '../Provisioning/Service/SQSService';
import {AbstractService} from '../Provisioning/Service/AbstractService';
import Mime from 'mime';
import FileSystemExtra from 'fs-extra';
import {InvalidConfigException} from './Exception/InvalidConfigException';
import {Exception} from '../Exception/Exception';
import {DeepConfigDriver} from '../Tags/Driver/DeepConfigDriver';
import {Action} from '../Microservice/Metadata/Action';

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
    this._path = Path.normalize(path);
    this._outputPath = Path.normalize(property.path);
    this._zipPath = Path.join(this._outputPath, `${microserviceIdentifier}_lambda_${identifier}.zip`);

    this._memorySize = Lambda.DEFAULT_MEMORY_LIMIT;
    this._timeout = Lambda.DEFAULT_TIMEOUT;
    this._runtime = Lambda.DEFAULT_RUNTIME;

    this._forceUserIdentity = false;
    this._wasPreviouslyDeployed = false;
    this._uploadedLambda = {};

    // @todo: find a better solution
    this._checkIfLambdaWasDeployedPreviously();
  }

  /**
   * @returns {Boolean}
   */
  get forceUserIdentity() {
    return this._forceUserIdentity;
  }

  /**
   * @param {Boolean} state
   */
  set forceUserIdentity(state) {
    this._forceUserIdentity = state;
  }

  /**
   * @private
   */
  _checkIfLambdaWasDeployedPreviously() {
    this._wasPreviouslyDeployed = this._property
      .config
      .microservices[this._microserviceIdentifier]
      .deployedServices
      .lambdas
      .hasOwnProperty(this._identifier);
  }

  /**
   * @param {Object} propertyConfig
   * @param {Boolean} localRuntime
   * @return {Object}
   */
  createConfig(propertyConfig, localRuntime = false) {
    let config = Frontend.createConfig(propertyConfig, localRuntime, true);

    config.forceUserIdentity = this._forceUserIdentity;
    config.microserviceIdentifier = this.microserviceIdentifier;
    config.awsAccountId = propertyConfig.awsAccountId;
    config.appIdentifier = propertyConfig.appIdentifier;
    config.timestamp = (new Date()).getTime();
    config.buckets = S3Service.fakeBucketsConfig(propertyConfig.appIdentifier);
    config.tablesNames = {};

    config.cacheDsn = '';

    if (propertyConfig.provisioning) {
      let sqsQueues = propertyConfig.provisioning[Core.AWS.Service.SIMPLE_QUEUE_SERVICE].queues;
      config.dbOffloadQueue = sqsQueues[SQSService.DB_OFFLOAD_QUEUE] || {};

      config.buckets = propertyConfig.provisioning[Core.AWS.Service.SIMPLE_STORAGE_SERVICE].buckets;
      config.tablesNames = propertyConfig.provisioning[Core.AWS.Service.DYNAMO_DB].tablesNames;

      config.cacheDsn = propertyConfig.provisioning[Core.AWS.Service.ELASTIC_CACHE].dsn;
    } else {
      for (let modelKey in config.models) {
        if (!config.models.hasOwnProperty(modelKey)) {
          continue;
        }

        let backendModels = config.models[modelKey];

        for (let modelName in backendModels) {
          if (!backendModels.hasOwnProperty(modelName)) {
            continue;
          }

          config.tablesNames[modelName] = AbstractService.generateAwsResourceName(
            modelName,
            Core.AWS.Service.DYNAMO_DB,
            propertyConfig.awsAccountId,
            propertyConfig.appIdentifier,
            propertyConfig.env
          );
        }
      }
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
   * Mainly used for local server
   *
   * @returns {String}
   */
  get arnGeneralized() {
    return `arn:aws:lambda:::function:${this.functionName}`;
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
   * @param {Object[]} validationSchemas
   * @param {Boolean} useSymlink
   */
  injectValidationSchemas(validationSchemas, useSymlink = false) {
    let schemasPath = Path.join(this.path, Core.AWS.Lambda.Runtime.VALIDATION_SCHEMAS_DIR);

    if (FileSystem.existsSync(schemasPath)) {
      FileSystemExtra.removeSync(schemasPath);
    }

    validationSchemas.forEach((schema) => {
      let schemaPath = schema.schemaPath;
      let destinationSchemaPath = Path.join(schemasPath, `${schema.name}.js`);

      if (useSymlink) {
        FileSystemExtra.ensureSymlinkSync(schemaPath, destinationSchemaPath);
      } else {
        FileSystemExtra.copySync(schemaPath, destinationSchemaPath);
      }
    });
  }

  /**
   * @param {Function} callback
   * @returns {Lambda}
   */
  update(callback) {
    this.pack().ready(() => {
      this.updateCode().ready(callback);
    });

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Lambda}
   */
  deploy(callback) {
    this.pack().ready(() => {
      console.debug(`Lambda ${this._identifier} packing is ready`);

      this.upload().ready(callback);
    });

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

    output.on('close', () => {
      let bootstrapFile = Path.join(path, 'bootstrap.js');

      if (FileSystem.existsSync(bootstrapFile)) {
        Lambda._cleanupBootstrapFile(bootstrapFile);
      }

      ready = true;
    });

    wait.push(() => {
      return ready;
    });

    archive.pipe(output);

    archive
      .directory(path, false)
      .finalize();

    return wait;
  }

  /**
   * @param {String} lambdaPath
   * @param {String} packageFile
   * @param {String|null} runtime
   * @returns {WaitFor}
   */
  static injectPackageConfig(lambdaPath, packageFile, runtime = null) {
    let wait = new WaitFor();
    let ready = false;

    let configFile = Path.join(lambdaPath, Lambda.CONFIG_FILE);

    if (!FileSystem.existsSync(packageFile)) {
      throw new InvalidConfigException(`Package file not found in ${packageFile}!`);
    }

    if (!FileSystem.existsSync(configFile)) {
      throw new InvalidConfigException(`Config file not found in ${configFile}!`);
    }

    let cmd = `zip -r ${packageFile} ${Lambda.CONFIG_FILE}`;

    let bootstrapFile = Path.join(lambdaPath, 'bootstrap.js');
    let bootstrapBckFile = `${bootstrapFile}.${new Date().getTime()}.bck`;
    let bootstrapBck = false;

    // read bootstrap file from the archive (fail silently)
    if (Lambda.isNodeRuntime(runtime)) {
      if (FileSystem.existsSync(bootstrapFile)) {
        bootstrapBck = true;
        FileSystemExtra.copySync(bootstrapFile, bootstrapBckFile);
      }

      // @todo: remove this temporary hook by rewriting it in a native way
      let result = new Exec(`unzip -p ${packageFile} bootstrap.js > ${bootstrapFile}`)
        .runSync();

      if (result.succeed) {
        Lambda._tryInjectDeepConfigIntoBootstrapFile(bootstrapFile, configFile);

        cmd += ` && zip -r ${packageFile} bootstrap.js`;
      } else if(result.error) {
        console.error(result); //@todo: remove?
      }
    }

    // @todo: remove this temporary hook by rewriting it in a native way
    new Exec(`cd ${Path.dirname(configFile)} && ${cmd}`)
      .avoidBufferOverflow()
      .run((result) => {

        // restore original bootstrap.js
        if (Lambda.isNodeRuntime(runtime) && bootstrapBck) {
          FileSystemExtra.copySync(bootstrapBckFile, bootstrapFile);
          FileSystemExtra.removeSync(bootstrapBckFile);
        }

        if (result.failed) {
          throw new Exception(`Error while adding ${Lambda.CONFIG_FILE} to lambda build: ${result.error}`);
        }

        ready = true;
      });

    wait.push(() => {
      return ready;
    });

    return wait;
  }

  /**
   * @returns {WaitFor}
   */
  pack() {
    console.debug(`Start packing lambda ${this._identifier}`);

    this.persistConfig();
    this._injectDeepConfigIntoBootstrap();

    let buildFile = `${this._path}.zip`;

    if (FileSystem.existsSync(buildFile)) {
      console.debug(`Lambda prebuilt in ${buildFile}`);

      FileSystemExtra.copySync(buildFile, this._zipPath);

      return Lambda.injectPackageConfig(this._path, this._zipPath, this._runtime);
    } else {
      return Lambda.createPackage(this._path, this._zipPath);
    }
  }

  /**
   * @private
   */
  _injectDeepConfigIntoBootstrap(runtime) {
    if (Lambda.isNodeRuntime(runtime)) { // the only supported runtime
      let bootstrapFile = Path.join(this.path, 'bootstrap.js');
      let configFile = Path.join(this.path, Lambda.CONFIG_FILE);

      Lambda._tryInjectDeepConfigIntoBootstrapFile(bootstrapFile, configFile);
    }
  }

  /**
   * @param {String} bootstrapFile
   * @param {String} configFile
   * @private
   */
  static _tryInjectDeepConfigIntoBootstrapFile(bootstrapFile, configFile) {
    if (FileSystem.existsSync(configFile) && FileSystem.existsSync(bootstrapFile)) {
      let cfgPlain = `/*<DEEP_CFG_START> (${new Date().toLocaleString()})*/
global.${DeepConfigDriver.DEEP_CFG_VAR} =
  global.${DeepConfigDriver.DEEP_CFG_VAR} ||
  ${FileSystem.readFileSync(configFile).toString()};
/*<DEEP_CFG_END>*/`;
      let bootstrapContent = Lambda._cleanupBootstrapFile(bootstrapFile, true);

      // inject config after the 'use strict';
      FileSystem.writeFileSync(
        bootstrapFile,
        bootstrapContent.replace(/^['"]\s*use\s+strict\s*['"]\s*;?/i, `$&${cfgPlain}`)
      );
    }
  }

  /**
   * @param {String} bootstrapFile
   * @param {Boolean} skipWrite
   * @returns {String}
   * @private
   */
  static _cleanupBootstrapFile(bootstrapFile, skipWrite = false) {
    let bootstrapContent = FileSystem.readFileSync(bootstrapFile).toString();

    bootstrapContent = bootstrapContent.replace(/(\/\*<DEEP_CFG_START>(?:\n|.)+\/\*<DEEP_CFG_END>\*\/)/gi, '');

    if (!skipWrite) {
      FileSystem.writeFileSync(
        bootstrapFile,
        bootstrapContent
      );
    }

    return bootstrapContent;
  }

  /**
   * @returns {AwsRequestSyncStack}
   */
  updateCode() {
    return this.upload(true);
  }

  /**
   * @returns {String}
   * @private
   */
  get _uploadBucket() {
    let buckets = this._property.config.provisioning.s3.buckets;

    if (buckets.hasOwnProperty(S3Service.TMP_BUCKET)) {
      return buckets[S3Service.TMP_BUCKET].name;
    }

    return buckets[S3Service.PRIVATE_BUCKET].name;
  }

  /**
   * @param {String} uploadBucket
   * @returns {String|null}
   * @private
   */
  _getUploadKeyPrefix(uploadBucket) {
    return S3Service.isBucketTmp(uploadBucket) ? null : S3Service.TMP_BUCKET;
  }

  /**
   * @param {Boolean} update
   * @returns {AwsRequestSyncStack|WaitFor|*}
   */
  upload(update = false) {
    console.debug(`Start uploading lambda ${this._identifier}`);

    let lambda = this._property.provisioning.lambda;
    let s3 = this._property.provisioning.s3;
    let securityGroupId = this._property.config.provisioning.elasticache.securityGroupId;
    let subnetIds = this._property.config.provisioning.elasticache.subnetIds;

    let tmpBucket = this._uploadBucket;
    let objectPrefix = this._getUploadKeyPrefix(tmpBucket);
    let objectKey = this._zipPath.split(Path.sep).pop();

    if (objectPrefix) {
      objectKey = `${objectPrefix}/${objectKey}`;
    }

    let s3Params = {
      Bucket: tmpBucket,
      Key: objectKey,
      Body: FileSystem.readFileSync(this._zipPath),
      ContentType: Mime.lookup(this._zipPath),
    };

    let syncStack = new AwsRequestSyncStack();

    // @todo: Remove when exec role assign fixed
    syncStack.level(1).joinTimeout = 5000;

    syncStack.push(s3.putObject(s3Params), (error, data) => {
      if (error) {
        throw new FailedUploadingLambdaToS3Exception(objectKey, tmpBucket, error);
      }

      let request = null;

      console.debug(`Lambda ${this._identifier} uploaded`);

      let params = {
        FunctionName: this.functionName,
      };

      if (update && this._wasPreviouslyDeployed) {
        request = lambda.updateFunctionCode({
          S3Bucket: tmpBucket,
          S3Key: objectKey,
          S3ObjectVersion: data.VersionId,
          FunctionName: this.functionName,
        });
      } else {
        request = lambda.createFunction({
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
        });

        if (securityGroupId && subnetIds && Array.isArray(subnetIds) && subnetIds.length > 0) {
          request.VpcConfig = {
            SecurityGroupIds: [securityGroupId,],
            SubnetIds: subnetIds,
          };
        }
      }

      syncStack.level(1).push(request, (error, data) => {
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
      });
    });

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
    FileSystemExtra.ensureDirSync(this.path);

    JsonFile.writeFileSync(
      Path.join(this.path, Lambda.CONFIG_FILE),
      this.createConfig(this._property.config)
    );

    return this;
  }

  /**
   * @returns {String}
   */
  get handler() {
    let handler = null;

    switch(this._runtime) {
      case 'nodejs':
      case 'nodejs4.3':
        handler = 'bootstrap.handler';
        break;
      case 'java8':
        handler = 'bootstrap.handler::handle';
        break;
      case 'python2.7':
        handler = 'bootstrap.handler';
        break;
      default:
        throw new Error(`The Lambda runtime ${this._runtime} is not supported yet`);
    }

    return handler;
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE() {
    return Frontend.CONFIG_FILE;
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_TIMEOUT() {
    return Lambda.MAX_TIMEOUT;
  }

  /**
   * @returns {Number[]}
   */
  static get AVAILABLE_MEMORY_VALUES() {
    return [
      128, 192, 256, 320, 384, 448,
      512, 576, 640, 704, 768, 832,
      896, 960, 1024, 1088, 1152,
      1216, 1280, 1344, 1408,
      1472, 1536
    ];
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
  static get MAX_MEMORY_LIMIT() {
    return 1536;
  }

  /**
   * @returns {Number}
   */
  static get MAX_TIMEOUT() {
    return 60 * 5;
  }

  /**
   * @returns {String[]}
   */
  static get RUNTIMES() {
    return ['nodejs4.3', 'nodejs', 'java8', 'python2.7'];
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_RUNTIME() {
    return Lambda.RUNTIMES[0];
  }

  /**
   * @param {String} runtime
   */
  static isNodeRuntime(runtime) {
    return ['nodejs4.3', 'nodejs'].indexOf(runtime) !== -1;
  }
}
