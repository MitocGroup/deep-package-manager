/**
 * Created by AlexanderC on 6/4/15.
 */

'use strict';

import StringUtils from 'underscore.string';
import FileSystem from 'fs';
import exec from 'sync-exec';
import {FileWalker} from '../Helpers/FileWalker';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import JsonFile from 'jsonfile';
import {MissingRootIndexException} from './Exception/MissingRootIndexException';
import {FailedUploadingFileToS3Exception} from './Exception/FailedUploadingFileToS3Exception';
import {AwsRequestSyncStack} from '../Helpers/AwsRequestSyncStack';
import {Action} from '../Microservice/Metadata/Action';
import Core from 'deep-core';
import Tmp from 'tmp';
import OS from 'os';
import {APIGatewayService} from '../Provisioning/Service/APIGatewayService';
import path from 'path';

/**
 * Frontend
 */
export class Frontend {
  /**
   * @param {Object} microservicesConfig
   * @param {String} basePath
   */
  constructor(microservicesConfig, basePath) {
    this._microservicesConfig = microservicesConfig;
    this._basePath = StringUtils.rtrim(basePath, '/');
  }

  /**
   * @param {Object} propertyConfig
   * @return {Object}
   */
  static createConfig(propertyConfig) {
    let config = {
      env: propertyConfig.env,
      deployId: propertyConfig.deployId,
      awsRegion: propertyConfig.awsRegion,
      models: propertyConfig.models,
      identityPoolId: '',
      identityProviders: '',
      microservices: {},
      globals: propertyConfig.globals,
    };

    let apiGatewayBaseUrl = '';

    if (propertyConfig.provisioning) {
      let cognitoConfig = propertyConfig.provisioning[Core.AWS.Service.COGNITO_IDENTITY];

      config.identityPoolId = cognitoConfig.identityPool.IdentityPoolId;
      config.identityProviders = cognitoConfig.identityPool.SupportedLoginProviders;

      apiGatewayBaseUrl = propertyConfig.provisioning[Core.AWS.Service.API_GATEWAY].api.baseUrl;
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
            region: propertyConfig.awsRegion, // @todo: set it from lambda provision
            source: {
              api: apiGatewayBaseUrl + APIGatewayService.pathify(microserviceIdentifier, resourceName, actionName),
              original: originalSource,
            },
          };
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

    console.log(`${new Date().toTimeString()} dump AWS tmp credentials into ${credentialsFile}`);

    FileSystem.writeFileSync(credentialsFile, credentials);

    let syncCommand = `export AWS_CONFIG_FILE=${credentialsFile}; `;
    syncCommand += `aws s3 sync --profile deep --storage-class REDUCED_REDUNDANCY '${this.path}' 's3://${bucketName}'`;

    console.log(`${new Date().toTimeString()} running tmp hook ${syncCommand}`);

    let syncResult = exec(syncCommand);

    if (syncResult.status !== 0) {
      throw new FailedUploadingFileToS3Exception('*', bucketName, syncResult.stderr);
    }

    // @todo: improve this by using directory upload
    //for (let file of walker.walk(this.path, FileWalker.skipDotsFilter())) {
    //    let params = {
    //        Bucket: bucketName,
    //        Key: file.slice(sliceOffset),
    //        Body: FileSystem.readFileSync(file),
    //        ContentType: Mime.lookup(file)
    //    };
    //
    //    syncStack.push(s3.putObject(params), function(error, data) {
    //        if (error) {
    //            throw new FailedUploadingFileToS3Exception(file, bucketName, error);
    //        }
    //    }.bind(this));
    //}

    return syncStack.join();
  }

  /**
   * @param {Object} propertyConfig
   */
  build(propertyConfig) {
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
