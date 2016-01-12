/**
 * Created by AlexanderC on 6/4/15.
 */

'use strict';

import StringUtils from 'underscore.string';
import FileSystem from 'fs';
import {Exec} from '../Helpers/Exec';
import {FileWalker} from '../Helpers/FileWalker';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import JsonFile from 'jsonfile';
import {MissingRootIndexException} from './Exception/MissingRootIndexException';
import {FailedUploadingFileToS3Exception} from './Exception/FailedUploadingFileToS3Exception';
import {AwsRequestSyncStack} from '../Helpers/AwsRequestSyncStack';
import {WaitFor} from '../Helpers/WaitFor';
import {Action} from '../Microservice/Metadata/Action';
import Core from 'deep-core';
import Tmp from 'tmp';
import OS from 'os';
import ZLib from 'zlib';
import {APIGatewayService} from '../Provisioning/Service/APIGatewayService';
import {DeployIdInjector} from '../Assets/DeployIdInjector';
import {Optimizer} from '../Assets/Optimizer';

/**
 * Frontend
 */
export class Frontend {
  /**
   * @param {Object} microservicesConfig
   * @param {String} basePath
   * @param {String} deployId
   */
  constructor(microservicesConfig, basePath, deployId) {
    this._microservicesConfig = microservicesConfig;
    this._basePath = StringUtils.rtrim(basePath, '/');
    this._deployId = deployId;
  }

  /**
   * @returns {String}
   */
  get deployId() {
    return this._deployId;
  }

  /**
   * @param {Object} propertyConfig
   * @param {Boolean} localRuntime
   * @return {Object}
   */
  static createConfig(propertyConfig, localRuntime = false) {
    let config = {
      env: propertyConfig.env,
      deployId: propertyConfig.deployId,
      awsRegion: propertyConfig.awsRegion,
      models: propertyConfig.models,
      identityPoolId: '',
      identityProviders: '',
      microservices: {},
      globals: propertyConfig.globals,
      search: {},
    };

    let apiGatewayBaseUrl = '';

    if (propertyConfig.provisioning) {
      let cognitoConfig = propertyConfig.provisioning[Core.AWS.Service.COGNITO_IDENTITY];

      config.identityPoolId = cognitoConfig.identityPool.IdentityPoolId;
      config.identityProviders = cognitoConfig.identityPool.SupportedLoginProviders;

      apiGatewayBaseUrl = propertyConfig.provisioning[Core.AWS.Service.API_GATEWAY].api.baseUrl;

      if (propertyConfig.provisioning.hasOwnProperty(Core.AWS.Service.CLOUD_SEARCH)) {
        let cloudSearchConfig = propertyConfig.provisioning[Core.AWS.Service.CLOUD_SEARCH];

        for (let modelName in cloudSearchConfig) {
          if (!cloudSearchConfig.hasOwnProperty(modelName)) {
            continue;
          }

          let domainConfig = cloudSearchConfig[modelName];

          config.search[modelName] = {
            endpoint: domainConfig.endpoints.search,
            indexes: domainConfig.indexes,
            suggesters: domainConfig.suggesters,
          };
        }
      }
    }

    for (let microserviceIdentifier in propertyConfig.microservices) {
      if (!propertyConfig.microservices.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = propertyConfig.microservices[microserviceIdentifier];
      let microserviceConfig = {
        isRoot: microservice.isRoot,
        parameters: microservice.parameters.frontend,
        resources: {},
      };

      for (let resourceName in microservice.resources) {
        if (!microservice.resources.hasOwnProperty(resourceName)) {
          continue;
        }

        microserviceConfig.resources[resourceName] = {};

        let resourceActions = microservice.resources[resourceName];

        for (let actionName in resourceActions) {
          if (!resourceActions.hasOwnProperty(actionName)) {
            continue;
          }

          let action = resourceActions[actionName];

          let originalSource = (action.type === Action.LAMBDA) ?
            microservice.lambdas[action.identifier].arn :
            action.source;

          microserviceConfig.resources[resourceName][action.name] = {
            type: action.type,
            methods: action.methods,
            forceUserIdentity: action.forceUserIdentity,
            apiCache: {
              enabled: action.cacheEnabled,
              ttl: action.cacheTtl,
            },
            region: propertyConfig.awsRegion, // @todo: set it from lambda provision
            source: {
              api: apiGatewayBaseUrl + APIGatewayService.pathify(microserviceIdentifier, resourceName, actionName),
              original: originalSource,
            },
          };

          if (localRuntime) {
            microserviceConfig.resources[resourceName][action.name].source._localPath =
              microservice.lambdas[action.identifier].localPath;
          }
        }
      }

      config.microservices[microserviceIdentifier] = microserviceConfig;
    }

    return config;
  }

  /**
   * @returns {String}
   */
  get basePath() {
    return this._basePath;
  }

  /**
   * @param AWS
   * @param bucketName
   * @returns {WaitFor}
   */
  deploy(AWS, bucketName) {
    //let s3 = new AWS.S3();

    let syncStack = new AwsRequestSyncStack();

    //let walker = new FileWalker(FileWalker.RECURSIVE);
    //let sliceOffset = this.path.length + 1; // used to remove base path from file name

    // @todo: remove this hook when fixing s3 sync functionality
    let credentialsFile = Tmp.tmpNameSync();

    let credentials = `[profile deep]${OS.EOL}`;
    credentials += `aws_access_key_id=${AWS.config.credentials.accessKeyId}${OS.EOL}`;
    credentials += `aws_secret_access_key=${AWS.config.credentials.secretAccessKey}${OS.EOL}`;
    credentials += `region=${AWS.config.region}${OS.EOL}`;

    console.log(`dump AWS tmp credentials into ${credentialsFile}`);

    FileSystem.writeFileSync(credentialsFile, credentials);

    console.log(`Syncing ${this.path} with ${bucketName} (non HTML, TTL=86400)`);

    let syncResultNoHtml = this
      ._getSyncCommandNoHtml(credentialsFile, bucketName)
      .runSync();

    if (syncResultNoHtml.failed) {
      throw new FailedUploadingFileToS3Exception('*', bucketName, syncResultNoHtml.error);
    }

    console.log(`Syncing ${this.path} with ${bucketName} (HTML only, TTL=600)`);

    let syncResultHtml = this
      ._getSyncCommandHtmlOnly(credentialsFile, bucketName)
      .runSync();

    if (syncResultHtml.failed) {
      throw new FailedUploadingFileToS3Exception('*', bucketName, syncResultHtml.error);
    }

    FileSystem.unlinkSync(credentialsFile);

    // @todo: improve this by using directory upload
    //let files = walker.walk(this.path, FileWalker.skipDotsFilter());
    //for (let i in files) {
    //    if (!files.hasOwnProperty(i)) {
    //      continue;
    //    }
    //
    //    let file = files[i];
    //
    //    let params = {
    //        Bucket: bucketName,
    //        Key: file.slice(sliceOffset),
    //        Body: FileSystem.readFileSync(file),
    //        ContentType: Mime.lookup(file)
    //    };
    //
    //    syncStack.push(s3.putObject(params), (error, data) => {
    //        if (error) {
    //            throw new FailedUploadingFileToS3Exception(file, bucketName, error);
    //        }
    //    });
    //}

    return syncStack.join();
  }

  /**
   * @param {String} credentialsFile
   * @param {String} bucketName
   * @private
   */
  _getSyncCommandNoHtml(credentialsFile, bucketName) {
    return new Exec(
      `export AWS_CONFIG_FILE=${credentialsFile};`,
      'aws s3 sync',
      '--profile=deep',
      '--storage-class=REDUCED_REDUNDANCY',
      Frontend._contentEncodingExecOption,
      '--cache-control="max-age=86400"',
      '--exclude="*.html"',
      `'${this.path}'`,
      `'s3://${bucketName}'`
    );
  }

  /**
   * @param {String} credentialsFile
   * @param {String} bucketName
   * @private
   */
  _getSyncCommandHtmlOnly(credentialsFile, bucketName) {
    return new Exec(
      `export AWS_CONFIG_FILE=${credentialsFile};`,
      'aws s3 sync',
      '--profile=deep',
      '--storage-class=REDUCED_REDUNDANCY',
      Frontend._contentEncodingExecOption,
      '--cache-control="max-age=600"',
      '--exclude="*"',
      '--include="*.html"',
      `'${this.path}'`,
      `'s3://${bucketName}'`
    );
  }

  /**
   * @returns {String}
   * @private
   */
  static get _contentEncodingExecOption() {
    return Frontend._skipAssetsOptimizations ? null : '--content-encoding=gzip';
  }

  /**
   * @param {Object} propertyConfig
   * @param {Function} callback
   */
  build(propertyConfig, callback = () => {}) {
    if (!(propertyConfig instanceof Object)) {
      throw new InvalidArgumentException(propertyConfig, 'Object');
    }

    FileSystem.mkdirSync(this.path);
    JsonFile.writeFileSync(this.configPath, propertyConfig);

    for (let identifier in this._microservicesConfig) {
      if (!this._microservicesConfig.hasOwnProperty(identifier)) {
        continue;
      }

      let config = this._microservicesConfig[identifier];
      let modulePath = this.modulePath(identifier);
      let frontendPath = config.autoload.frontend;

      FileSystem.mkdirSync(modulePath);

      let walker = new FileWalker(FileWalker.RECURSIVE, '.deepignore');

      // @todo: implement this in a smarter way
      if (config.isRoot) {
        try {
          let indexFile = `${frontendPath}/index.html`;
          let indexStats = FileSystem.lstatSync(indexFile);

          if (!indexStats.isFile()) {
            throw new MissingRootIndexException(identifier);
          }
        } catch (e) {
          throw new MissingRootIndexException(identifier);
        }

        // The root micro-service frontend files are moved into property document ro
        walker.copy(frontendPath, this.path);

        FileSystem.rmdirSync(modulePath);
      } else {
        // All non root micro-service frontend files are namespaced by microservice identifier
        walker.copy(frontendPath, modulePath);
      }
    }

    if (Frontend._skipInjectDeployNumber) {
      return this._optimizeAssets(callback);
    }

    new DeployIdInjector(this.path, this._deployId)
      .prepare((error) => {
        let optCb = callback;

        if (error) {
          optCb = (optError) => {
            if (optError) {
              callback(new Error(
                `- OptimizerError: ${optError}${OS.EOL}- DeployIdInjectorError: ${error}`
              ));
              return;
            }

            callback(error);
          };
        }

        this._optimizeAssets(optCb);
      });
  }

  /**
   * @param {Function} callback
   * @private
   */
  _optimizeAssets(callback) {
    if (Frontend._skipAssetsOptimizations) {
      callback(null);
      return;
    }

    new Optimizer(this.path)
      .optimize(callback);
  }

  /**
   * @todo: get rid of this hook
   *
   * @returns {Boolean}
   * @private
   */
  static get _skipAssetsOptimizations() {
    return process.env.hasOwnProperty('DEEP_SKIP_ASSETS_OPTIMIZATION');
  }

  /**
   * @todo: get rid of this hook
   *
   * @returns {Boolean}
   * @private
   */
  static get _skipInjectDeployNumber() {
    return process.env.hasOwnProperty('DEEP_SKIP_DEPLOY_ID_INJECT');
  }

  /**
   * @param {String} moduleIdentifier
   * @returns {String}
   */
  modulePath(moduleIdentifier) {
    let base = this.path;

    return `${base}/${moduleIdentifier}`;
  }

  /**
   * @returns {String}
   */
  get configPath() {
    let base = this.path;

    return `${base}/_config.json`;
  }

  /**
   * @returns {String}
   */
  get path() {
    let base = this._basePath;

    return `${base}/_public`;
  }
}
