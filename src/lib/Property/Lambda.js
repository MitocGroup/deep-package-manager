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
import {AbstractService} from '../Provisioning/Service/AbstractService';
import Mime from 'mime';
import FileSystemExtra from 'fs-extra';
import {InvalidConfigException} from './Exception/InvalidConfigException';
import {Exception} from '../Exception/Exception';
import {DeepConfigDriver} from '../Tags/Driver/DeepConfigDriver';
import {Semaphore} from '../Helpers/Semaphore';

// @todo find more elegant way of defining it
global._deep_packSemaphore = global._deep_packSemaphore || new Semaphore('LAMBDA');
const packSemaphore = global._deep_packSemaphore;

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
    this._skipCompile = false;
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
   * @returns {Boolean}
   */
  get skipCompile() {
    return this._skipCompile;
  }

  /**
   * @param {Boolean} state
   */
  set skipCompile(state) {
    this._skipCompile = !!state;
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
    let microservice = this._property.microservice(this._microserviceIdentifier);

    config.forceUserIdentity = this._forceUserIdentity;
    config.skipCompile = this._skipCompile;
    config.microserviceIdentifier = this.microserviceIdentifier;
    config.awsAccountId = propertyConfig.awsAccountId;
    config.appIdentifier = propertyConfig.appIdentifier;
    config.timestamp = (new Date()).getTime();
    config.buckets = S3Service.fakeBucketsConfig(propertyConfig.appIdentifier, microservice.autoload.frontend);
    config.tablesNames = {};
    config.nonPartitionedModels = propertyConfig.nonPartitionedModels;

    config.cacheDsn = '';
    config.api = {};

    if (propertyConfig.provisioning) {
      let sqsQueues = propertyConfig.provisioning[Core.AWS.Service.SIMPLE_QUEUE_SERVICE].queues;
      let sqsDbOffloadQueuesMapping = propertyConfig
        .provisioning[Core.AWS.Service.SIMPLE_QUEUE_SERVICE].dbOffloadQueues;
      config.dbOffloadQueues = {};

      for (let queueName in sqsDbOffloadQueuesMapping) {
        if (!sqsDbOffloadQueuesMapping.hasOwnProperty(queueName) ||
          !sqsQueues.hasOwnProperty(queueName)) { // weird case but we should handle it
          continue;
        }

        let modelName = sqsDbOffloadQueuesMapping[queueName];
        let queueConfig = sqsQueues[queueName];

        config.dbOffloadQueues[modelName] = queueConfig;
      }

      config.buckets = propertyConfig.provisioning[Core.AWS.Service.SIMPLE_STORAGE_SERVICE].buckets;
      config.tablesNames = propertyConfig.provisioning[Core.AWS.Service.DYNAMO_DB].tablesNames;

      config.cacheDsn = propertyConfig.provisioning[Core.AWS.Service.ELASTIC_CACHE].dsn;

      let apiGateway = propertyConfig.provisioning[Core.AWS.Service.API_GATEWAY].api;

      if (apiGateway) {
        config.api = {
          id: apiGateway.id,
          name: apiGateway.name,
          baseUrl: apiGateway.baseUrl,
          authorizer: apiGateway.authorizer
        };

        let usagePlan = apiGateway.usagePlan;

        if (usagePlan) {
          config.api.usagePlan = {
            id: usagePlan.id,
            name: usagePlan.name,
            stages: this._addUsagePlanStageToConfig(apiGateway.id, usagePlan.apiStages || [], apiGateway.stage)
          };
        }
      }
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
   * @param {String} apiId
   * @param {Object[]} apiStages
   * @param {String} stageName
   * @returns {*}
   * @private
   */
  _addUsagePlanStageToConfig(apiId, apiStages, stageName) {
    for (let key in apiStages) {
      if (!apiStages.hasOwnProperty(key)) {
        continue;
      }

      if (apiStages[key].stage === stageName) {
        return apiStages;
      }
    }

    return apiStages.concat([{
      apiId: apiId,
      stage: stageName
    }]);
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
   * @returns {Boolean}
   */
  get xRayEnabled() {
    let xRayConfig = this._property.config.globals.xRay || {};

    return !!xRayConfig.enabled;
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
  get functionDescription() {
    return `Deployed on ${new Date().toString()}`;
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
    packSemaphore.wrap(() => {
      return new Promise((resolve, reject) => {
        this.pack().ready(() => {
          console.debug(`Lambda ${this._identifier} packing is ready`);
          
          this.updateCode()
            .ready(() => resolve());
        });
      }).catch(err => {
        console.error('Error Message:', err);
      });
    }, this.path).then(() => callback());
    
    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Lambda}
   */
  deploy(callback) {
    packSemaphore.wrap(() => {
      return new Promise((resolve, reject) => {
        this.pack().ready(() => {
          console.debug(`Lambda ${this._identifier} packing is ready`);

          this.upload()
            .ready(() => resolve());
        });
      });
    }, this.path).then(() => callback());

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

  static externalPackage(buildpath){
    let wait = new WaitFor();
    
    console.log('Detected external lambda:', buildpath);
    
    wait.push(() => {
      return true;
    });
    
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
    this._injectDeepConfigIntoBootstrap(this._runtime);

    let buildFile = `${this._path}.zip`;

    console.debug(`Lambda zip will be stored ${buildFile}`);
    let splittedPath = this._path.split('/');
    let lambdaName = splittedPath[splittedPath.length - 1];
    let lambdaCategory = splittedPath[splittedPath.length - 2];
    let currentActions = this._property.microservice(this._microserviceIdentifier).resources.rawResources[lambdaCategory];

    console.debug(`Checking if skipCompile is enabled for ${lambdaName}`);
    if (currentActions[lambdaName] && currentActions[lambdaName].hasOwnProperty(skipCompile) && currentActions[lambdaName].skipCompile) {
      if (!FileSystem.existsSync(buildFile)) {
        console.debug(`Creating externalPackage zip file from ${this,_path}`);
        let result = new Exec(`cd ${this._path} && zip -r ${buildFile} ./*`).runSync();
      }

      FileSystemExtra.copySync(buildFile, this._zipPath);

      console.debug(`Return Lambda zip file as externalPackage ${buildFile}`);
      return Lambda.externalPackage(buildFile);
    }

    if (FileSystem.existsSync(buildFile)) {
      FileSystemExtra.copySync(buildFile, this._zipPath);

      console.debug(`Return Lambda zip file with injected config ${this._runtime}`);
      return Lambda.injectPackageConfig(this._path, this._zipPath, this._runtime);
    } else {
      console.debug(`Return Lambda zip file as regular ${this._zipPath}`);
      return Lambda.createPackage(this._path, this._zipPath);
    }
  }

  /**
   * @param {*} runtime
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
        `${cfgPlain}\n${bootstrapContent}`
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

    let action = this._property.microservice(this._microserviceIdentifier).resources.actions.pop();
    this._property.provisioning.lambda.config.httpOptions.timeout = action.engine.uploadTimeout;

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
      let additionalRequest = null;

      console.debug(`Lambda ${this._identifier} code uploaded`);

      if (update && this._wasPreviouslyDeployed) {
        let funcConfig = {
          FunctionName: this.functionName,
          Description: this.functionDescription,
          Handler: this.handler,
          Role: this._execRole.Arn,
          Runtime: this._runtime,
          MemorySize: this._memorySize,
          Timeout: this._timeout,
        };

        if (!Lambda.isEdgeRuntime(this._runtime)) {
          funcConfig.TracingConfig =  {
            Mode: this.xRayEnabled ? 'Active' : 'PassThrough'
          };

          funcConfig.Environment = {
            Variables: {
              'DEEP_X_RAY_ENABLED': `${this.xRayEnabled}`
            }
          };
        }

        // update function configuration
        additionalRequest = lambda.updateFunctionConfiguration(funcConfig);
        
        request = lambda.updateFunctionCode({
          S3Bucket: tmpBucket,
          S3Key: objectKey,
          S3ObjectVersion: data.VersionId,
          FunctionName: this.functionName,
        });
      } else {
        let funcConfig = {
          Code: {
            S3Bucket: tmpBucket,
            S3Key: objectKey,
            S3ObjectVersion: data.VersionId,
          },
          FunctionName: this.functionName,
          Description: this.functionDescription,
          Handler: this.handler,
          Role: this._execRole.Arn,
          Runtime: this._runtime,
          MemorySize: this._memorySize,
          Timeout: this._timeout,
        };

        if (!Lambda.isEdgeRuntime(this._runtime)) {
          funcConfig.TracingConfig =  {
            Mode: this.xRayEnabled ? 'Active' : 'PassThrough'
          };

          funcConfig.Environment = {
            Variables: {
              'DEEP_X_RAY_ENABLED': `${this.xRayEnabled}`
            }
          };
        }

        request = lambda.createFunction(funcConfig);

        this._fixLambdaCreateIssue(request);

        if (securityGroupId && subnetIds && Array.isArray(subnetIds) && subnetIds.length > 0) {
          request.VpcConfig = {
            SecurityGroupIds: [securityGroupId,],
            SubnetIds: subnetIds,
          };
        }
      }

      if (additionalRequest) {
        syncStack.level(2).push(additionalRequest, (error, data) => {
          if (error) {
            
            // This is not critical, just warn developer
            console.warn(
              `Lambda ${this._identifier} failed to process configuration`,
              error
            );
          } else {
            console.debug(`Lambda ${this._identifier} configuration processed`);
          }
        });
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
        
        console.debug(`Lambda ${this._identifier} code and configuration processed`);

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
      Description: this.functionDescription,
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
   * @see: https://github.com/awslabs/chalice/blob/0.0.1/chalice/deployer.py#L286
   * @param {AWS.Request} request
   * @private
   */
  _fixLambdaCreateIssue(request) {
    request.on('retry', response => {
      if (response.error.code === 'InvalidParameterValueException') {
        console.warn('Lambda upload failed. Retrying...');

        response.error.retryable = true;
        response.error.rertyCount = 5000; // wait 5 seconds
      }
    });
  }

  /**
   * @returns {String}
   */
  get handler() {
    let handler = null;

    switch(this._runtime) {
      case 'nodejs':
      case 'nodejs4.3':
      case 'nodejs4.3-edge':
      case 'nodejs6.10':
        handler = 'bootstrap.handler';
        break;
      case 'java8':
        handler = 'bootstrap.handler::handle';
        break;     
      case 'python2.7':      
      case 'python3.6':
        handler = 'bootstrap.handler';
        break;
      case 'dotnetcore1.0':
        handler = 'DeepApp::Handler.Handler::Handle';
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

  static get DEFAULT_UPLOAD_TIMEOUT() {
    return 120000;
  }

  /**
   * @returns {Number[]}
   */
  static get AVAILABLE_MEMORY_VALUES() {
    return [
      128, 192, 256, 320, 384, 448, 
      512, 576, 640, 704, 768, 832, 
      896, 960, 1024, 1088, 1152, 
      1216, 1280, 1344, 1408, 1472,
      1536, 
    ];
  }

  /**
   * @returns {Number}
   *
   * @todo find out most suitable default value
   *       when deep-benchmarking ready
   */
  static get DEFAULT_MEMORY_LIMIT() {
    return 512;
  }

  /**
   * @returns {Number}
   */
  static get MIN_MEMORY_LIMIT() {
    return Lambda.AVAILABLE_MEMORY_VALUES.shift();
  }

  /**
   * @returns {Number}
   */
  static get MAX_MEMORY_LIMIT() {
    return Lambda.AVAILABLE_MEMORY_VALUES.pop();
  }

  /**
   * @returns {Number}
   */
  static get MAX_TIMEOUT() {
    return 60 * 5;
  }

  static get MAX_UPLOAD_TIMEOUT() {
    return 240000;
  }

  /**
   * @returns {String[]}
   */
  static get RUNTIMES() {
    return [
      'nodejs6.10', 'nodejs4.3', 'nodejs', 
      'java8', 'python2.7', 'python3.6', 
      'dotnetcore1.0', 'nodejs4.3-edge',
    ];
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_RUNTIME() {
    return Lambda.RUNTIMES[0];
  }

  /**
   * @param {String} runtime
   * @returns {boolean}
   */
  static isNodeRuntime(runtime) {
    return [
      'nodejs6.10', 'nodejs4.3', 'nodejs', 'nodejs4.3-edge'
    ].indexOf(runtime) !== -1;
  }

  /**
   * @param {String} runtime
   * @returns {boolean}
   */
  static isEdgeRuntime(runtime) {
    return /^.+-edge$/.test(runtime);
  }
}
