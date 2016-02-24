/**
 * Created by AlexanderC on 11/26/15.
 */

'use strict';

import {AbstractMatcher} from './AbstractMatcher';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import Core from 'deep-core';
import {MissingProvisioningConfig} from './Exception/MissingProvisioningConfig';
import {Undeploy} from '../Undeploy';
import {CloudWatchLogsDriver} from '../ListingDriver/CloudWatchLogsDriver';

export class ProvisioningDumpFileMatcher extends AbstractMatcher {
  /**
   * @param {Property|Object} property
   * @param {*} args
   */
  constructor(property, ...args) {
    super(...args);

    this._property = property;
    this._deployConfig = ProvisioningDumpFileMatcher._createDeployConfigObj();
  }

  /**
   * @returns {Property|Object}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Object}
   */
  get deployConfig() {
    return this._deployConfig;
  }

  /**
   * @param {String} type
   * @param {String} resourceId
   * @returns {Boolean}
   */
  match(type, resourceId) {
    return this._deployConfig[type].indexOf(resourceId) !== -1;
  }

  /**
   * @param {Function} cb
   * @param {String} cfgBucket
   * @returns {ProvisioningDumpFileMatcher}
   */
  read(cb, cfgBucket = null) {
    this._property.configObj.tryLoadConfig(() => {
      try {
        this._fillFromConfig();

        cb(null);
      } catch (e) {
        cb(e);
      }
    }, cfgBucket);

    return this;
  }

  /**
   * @private
   */
  _fillFromConfig() {
    let config = this._property.config;

    if (this._property.configObj.configExists) {
      let deployProvisioning = config.provisioning;

      if (deployProvisioning.apigateway && deployProvisioning.apigateway.api) {
        this._deployConfig.APIGateway.push(deployProvisioning.apigateway.api.id);

        if (deployProvisioning.apigateway.api.role) {
          this._deployConfig.IAM.push(
            deployProvisioning.apigateway.api.role.RoleName
          );
        }
      }

      if (deployProvisioning.dynamodb && deployProvisioning.dynamodb.tablesNames) {
        this._deployConfig.DynamoDB = ProvisioningDumpFileMatcher._objectValues(
          deployProvisioning.dynamodb.tablesNames
        );
      }

      if (deployProvisioning['cognito-identity'] &&
        deployProvisioning['cognito-identity'].identityPool &&
        deployProvisioning['cognito-identity'].identityPool.IdentityPoolId) {

        this._deployConfig.CognitoIdentity.push(
          deployProvisioning['cognito-identity'].identityPool.IdentityPoolId
        );
      }

      if (deployProvisioning.cloudfront && deployProvisioning.cloudfront.id) {
        this._deployConfig.CloudFront.push(deployProvisioning.cloudfront.id);
      }

      if (deployProvisioning.s3 && deployProvisioning.s3.buckets) {
        let s3Objects = ProvisioningDumpFileMatcher._objectValues(deployProvisioning.s3.buckets);

        for (let i in s3Objects) {
          if (!s3Objects.hasOwnProperty(i)) {
            continue;
          }

          let s3BucketName = s3Objects[i].name;

          this._deployConfig.S3.push(s3BucketName);
        }
      }

      if (deployProvisioning.sqs && deployProvisioning.sqs.queues) {
        let queues = deployProvisioning.sqs.queues;

        for (let key in queues) {
          if (!queues.hasOwnProperty(key)) {
            continue;
          }

          let queue = queues[key];

          this._deployConfig.SQS.push(queue.url);
        }
      }

      if (deployProvisioning['cognito-identity'] && deployProvisioning['cognito-identity'].roles) {
        let identityPoolRoles = deployProvisioning['cognito-identity'].roles;

        this._deployConfig.IAM.push(identityPoolRoles.authenticated.RoleName);
        this._deployConfig.IAM.push(identityPoolRoles.unauthenticated.RoleName);
      }

      if (deployProvisioning.lambda && deployProvisioning.lambda.executionRoles) {
        let lambdaExecRolesVector = ProvisioningDumpFileMatcher._objectValues(
          deployProvisioning.lambda.executionRoles
        );

        for (let i in lambdaExecRolesVector) {
          if (!lambdaExecRolesVector.hasOwnProperty(i)) {
            continue;
          }

          let lambdaExecRoles = ProvisioningDumpFileMatcher._objectValues(lambdaExecRolesVector[i]);

          for (let j in lambdaExecRoles) {
            if (!lambdaExecRoles.hasOwnProperty(j)) {
              continue;
            }

            this._deployConfig.IAM.push(lambdaExecRoles[j].RoleName);
          }
        }
      }

      if (deployProvisioning.lambda && deployProvisioning.lambda.names) {
        let lambdaNamesVector = ProvisioningDumpFileMatcher._objectValues(
          deployProvisioning.lambda.names
        );

        for (let i in lambdaNamesVector) {
          if (!lambdaNamesVector.hasOwnProperty(i)) {
            continue;
          }

          let lambdaNamesChunk = ProvisioningDumpFileMatcher._objectValues(
            lambdaNamesVector[i]
          );

          this._deployConfig.Lambda = this._deployConfig.Lambda.concat(lambdaNamesChunk);
        }
      }

      if (deployProvisioning.elasticache) {
        this._deployConfig.ElastiCache.push(deployProvisioning.elasticache.clusterId);
      }

      this._deployConfig.CloudWatchLogs = this._deployConfig.Lambda.map((lambdaName) => {
        return `${CloudWatchLogsDriver.LAMBDA_LOG_GROUP_PREFIX}${lambdaName}`;
      });

      if (deployProvisioning.apigateway && deployProvisioning.apigateway.api &&
        deployProvisioning.apigateway.api.logGroupName) {
        this._deployConfig.CloudWatchLogs.push(deployProvisioning.apigateway.api.logGroupName);
      }
    } else {
      throw new MissingProvisioningConfig(this.fileName, 'provisioning');
    }
  }

  /**
   * @param {Object} obj
   * @returns {Array}
   * @private
   */
  static _objectValues(obj) {
    let keys = Object.keys(obj);
    let vector = [];

    for (let i in keys) {
      if (!keys.hasOwnProperty(i)) {
        continue;
      }

      let val = obj[keys[i]];

      vector.push(val);
    }

    return vector;
  }

  /**
   * @param {Function} cb
   */
  bckConfigFile(cb) {
    fse.move(this.fileName, this.fileNameBck, (error) => {
      cb(error);
    });
  }

  /**
   * @returns {String}
   */
  get fileName() {
    return this._property.configObj.configFile;
  }

  /**
   * @returns {String}
   */
  get fileNameBck() {
    return `${this.fileName}.bck`;
  }

  /**
   * @param {String[]} services
   * @returns {Object}
   * @private
   */
  static _createDeployConfigObj(services = ProvisioningDumpFileMatcher.SERVICES) {
    let result = {};

    for (let i in services) {
      if (!services.hasOwnProperty(i)) {
        continue;
      }

      let serviceName = services[i];

      result[serviceName] = [];
    }

    return result;
  }

  /**
   * @returns {String[]}
   */
  static get SERVICES() {
    return Undeploy.SERVICES;
  }
}
