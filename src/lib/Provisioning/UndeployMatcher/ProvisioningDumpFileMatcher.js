/**
 * Created by AlexanderC on 11/26/15.
 */

'use strict';

import {AbstractMatcher} from './AbstractMatcher';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import Core from 'deep-core';
import {S3Service} from '../Service/S3Service';
import {MissingProvisioningConfig} from './Exception/MissingProvisioningConfig';
import {Undeploy} from '../Undeploy';

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
    if (cfgBucket) {
      this._assureDumpFile(cfgBucket, (error) => {
        if (error) {
          cb(error);
          return;
        }

        this._manageDumpFile(cb);
      });

      return this;
    }

    this._manageDumpFile(cb);

    return this;
  }

  /**
   * @param {Function} cb
   * @private
   */
  _manageDumpFile(cb) {
    if (fs.existsSync(this.fileName)) {
      let rawConfig = fse.readJson(this.fileName, (error, config) => {
        if (error) {
          cb(error);
          return;
        }

        if (config.provisioning) {
          let deployProvisioning = config.provisioning;

          if (deployProvisioning.apigateway && deployProvisioning.apigateway.api) {
            this._deployConfig.APIGateway.push(deployProvisioning.apigateway.api.id);
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

          cb(null);
          return;
        }

        cb(new MissingProvisioningConfig(this.fileName, 'provisioning'));
      });

      return;
    }

    cb(new MissingProvisioningConfig(this.fileName));
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
   * @param {String} cfgBucket
   * @param {Function} cb
   * @private
   */
  _assureDumpFile(cfgBucket, cb) {
    if (!fs.existsSync(this.fileName)) {
      let s3 = this._s3;

      var payload = {
        Bucket: cfgBucket,
        Key: ProvisioningDumpFileMatcher.DUMP_FILE_NAME,
      };

      s3.getObject(payload, (error, data) => {
        if (error) {
          cb(error);
          return;
        }

        fs.writeFile(this.fileName, data.Body.toString(), (error) => {
          cb(error);
        });
      });
    }
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
   * @returns {AWS.apiLoader.services.ec2.2015-10-01.shapes.S1f.members.S3|{type, members}|AWS.apiLoader.services.firehose.2015-08-04.shapes.S3|{type, required, members}|AWS.apiLoader.services.opsworks.2013-02-18.shapes.S3|{type, member}|*}
   * @private
   */
  get _s3() {
    let appropriateRegion = Core.AWS.Region.getAppropriateAwsRegion(
      this._property.config.aws.region,
      S3Service.AVAILABLE_REGIONS
    );

    return new this._property.AWS.S3({
      region: appropriateRegion
    });
  }

  /**
   * @returns {String}
   */
  get fileName() {
    return path.join(
      this._property.path,
      ProvisioningDumpFileMatcher.DUMP_FILE_NAME
    );
  }

  /**
   * @returns {String}
   */
  get fileNameBck() {
    return path.join(
      this._property.path,
      ProvisioningDumpFileMatcher.DUMP_FILE_NAME_BCK
    );
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
   * @returns {String}
   */
  static get DUMP_FILE_NAME_BCK() {
    return `.cfg.deeploy.json.${new Date().getTime()}`;
  }

  /**
   * @returns {String}
   */
  static get DUMP_FILE_NAME() {
    return '.cfg.deeploy.json';
  }

  /**
   * @returns {String[]}
   */
  static get SERVICES() {
    return Undeploy.SERVICES;
  }
}
