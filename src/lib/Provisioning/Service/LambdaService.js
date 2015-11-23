/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {S3Service} from './S3Service';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {Action} from '../../Microservice/Metadata/Action';
import {Lambda} from '../../Property/Lambda';
import {IAMService} from './IAMService';
import objectMerge from 'object-merge';
import {_extend as extend} from 'util';
import {CognitoIdentityService} from './CognitoIdentityService';

/**
 * Lambda service
 */
export class LambdaService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._deployedRoles = [];
  }

  /**
   * @private
   */
  _onConfigInject() {
    this._deployedRoles = this._getDeployedRoles();
  }

  /**
   * @returns {String[]}
   * @private
   */
  _getDeployedRoles() {
    let deployedRoles = [];

    if (this.isUpdate) {
      let execRoles = this._config.executionRoles;

      for (let microserviceIdentifier in execRoles) {
        if (!execRoles.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        let microserviceRoles = execRoles[microserviceIdentifier];

        for (let lambdaIdentifier in microserviceRoles) {
          if (!microserviceRoles.hasOwnProperty(lambdaIdentifier)) {
            continue;
          }

          let execRole = microserviceRoles[lambdaIdentifier];

          deployedRoles.push(execRole.RoleName);
        }
      }
    }

    return deployedRoles;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.LAMBDA;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.US_EAST_N_VIRGINIA,
      Core.AWS.Region.US_WEST_OREGON,
      Core.AWS.Region.EU_IRELAND,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _setup(services) {
    let microservices = this.provisioning.property.microservices;

    this._createExecRoles(
      microservices
    )(function(execRoles) {
      let lambdaNames = this._generateLambdasNames(microservices);

      this._config.names = this.isUpdate
        ? objectMerge(this._config.names, lambdaNames)
        : lambdaNames;

      this._config.executionRoles = this.isUpdate
        ? objectMerge(this._config.executionRoles, execRoles)
        : execRoles;

      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _postProvision(services) {
    let buckets = services.find(S3Service).config().buckets;

    this._attachPolicyToExecRoles(
      buckets,
      this._config.executionRoles
    )(function(policies) {
      this._config.executionRolesPolicies = this.isUpdate
        ? extend(this._config.executionRolesPolicies, policies)
        : policies;

      this._readyTeardown = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {String} roleName
   * @returns {Boolean}
   * @private
   */
  _isIamRoleNew(roleName) {
    return this._deployedRoles.indexOf(roleName) === -1;
  }

  /**
   * Creates execution roles for each lambda
   *
   * @param {Object} microservices
   *
   * @returns {Function}
   * @private
   */
  _createExecRoles(microservices) {
    let iam = this.provisioning.iam;
    let syncStack = new AwsRequestSyncStack();
    let execRoles = {};

    // role policy (definition) is common for all lambdas
    let execRolePolicy = IAMService.getAssumeRolePolicy(Core.AWS.Service.LAMBDA);

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];

      execRoles[microservice.identifier] = {};

      for (let actionKey in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = microservice.resources.actions[actionKey];

        if (action.type === Action.LAMBDA) {
          let roleName = this.generateAwsResourceName(
            this._actionIdentifierToPascalCase(action.identifier) + 'Exec',
            Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT,
            microservice.identifier
          );

          let params = {
            AssumeRolePolicyDocument: execRolePolicy.toString(),
            RoleName: roleName,
          };

          if (this._isIamRoleNew(roleName)) {
            syncStack.push(iam.createRole(params), function(error, data) {
              if (error) {
                // @todo: remove this hook
                if (Lambda.isErrorFalsePositive(error)) {
                  return;
                }

                throw new FailedToCreateIamRoleException(roleName, error);
              }

              execRoles[microservice.identifier][action.identifier] = data.Role;
            }.bind(this));
          }
        }
      }
    }

    return function(callback) {
      return syncStack.join().ready(function() {
        callback(execRoles);
      }.bind(this));
    }.bind(this);
  }

  /**
   * @param {Object<Instance>} microservices
   * @returns {Object}
   * @private
   */
  _generateLambdasNames(microservices) {
    let names = {};

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];

      names[microservice.identifier] = {};

      for (let actionKey in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = microservice.resources.actions[actionKey];

        if (action.type === Action.LAMBDA) {
          names[microservice.identifier][action.identifier] = this.generateAwsResourceName(
            this._actionIdentifierToPascalCase(action.identifier),
            Core.AWS.Service.LAMBDA,
            microservice.identifier
          );
        }
      }
    }

    return names;
  }

  /**
   * Adds inline policies to lambdas execution roles
   *
   * @param {Array} buckets
   * @param {String} roles
   * @returns {*}
   * @private
   */
  _attachPolicyToExecRoles(buckets, roles) {
    let iam = this.provisioning.iam;
    let policies = {};
    let syncStack = new AwsRequestSyncStack();

    for (let microserviceIdentifier in roles) {
      if (!roles.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microserviceRoles = roles[microserviceIdentifier];

      for (let lambdaIdentifier in microserviceRoles) {
        if (!microserviceRoles.hasOwnProperty(lambdaIdentifier)) {
          continue;
        }

        let execRole = microserviceRoles[lambdaIdentifier];

        if (this._isIamRoleNew(execRole.RoleName)) {
          let policyName = this.generateAwsResourceName(
            this._actionIdentifierToPascalCase(lambdaIdentifier) + 'Policy',
            Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT,
            microserviceIdentifier
          );

          let policy = this._getAccessPolicy(microserviceIdentifier, buckets);

          let params = {
            PolicyDocument: policy.toString(),
            PolicyName: policyName,
            RoleName: execRole.RoleName,
          };

          syncStack.push(iam.putRolePolicy(params), function(error, data) {
            if (error) {
              throw new FailedAttachingPolicyToRoleException(policyName, execRole.RoleName, error);
            }

            policies[execRole.RoleName] = policy;
          }.bind(this));
        }
      }
    }

    return function(callback) {
      return syncStack.join().ready(function() {
        callback(policies);
      }.bind(this));
    }.bind(this);
  }

  /**
   * Allows lambda function access to all microservice resources (FS s3 buckets, DynamoDD tables, etc.)
   *
   * @param {String} microserviceIdentifier
   * @param {Array} buckets
   *
   * @returns {Policy}
   */
  _getAccessPolicy(microserviceIdentifier, buckets) {
    let policy = new Core.AWS.IAM.Policy();

    // @todo - limit access to CloudWatch logs from * to certain actions and log groups
    let logsStatement = policy.statement.add();
    logsStatement.action.add(Core.AWS.Service.CLOUD_WATCH_LOGS, Core.AWS.IAM.Policy.ANY);
    logsStatement.resource.add(
      Core.AWS.Service.CLOUD_WATCH_LOGS,
      Core.AWS.IAM.Policy.ANY,
      this.awsAccountId,
      Core.AWS.IAM.Policy.ANY
    );

    let dynamoDbStatement = policy.statement.add();
    dynamoDbStatement.action.add(Core.AWS.Service.DYNAMO_DB, Core.AWS.IAM.Policy.ANY);
    dynamoDbStatement.resource.add(
      Core.AWS.Service.DYNAMO_DB,
      Core.AWS.IAM.Policy.ANY,
      this.awsAccountId,
      `table/${this._getGlobalResourceMask()}`
    );

    let s3Statement = policy.statement.add();
    let s3ListBucketStatement = policy.statement.add();

    s3Statement.action.add(Core.AWS.Service.SIMPLE_STORAGE_SERVICE, Core.AWS.IAM.Policy.ANY);
    s3ListBucketStatement.action.add(Core.AWS.Service.SIMPLE_STORAGE_SERVICE, 'ListBucket');

    for (let bucketSuffix in buckets) {
      if (!buckets.hasOwnProperty(bucketSuffix)) {
        continue;
      }

      let bucket = buckets[bucketSuffix];

      let s3Resource = s3Statement.resource.add();
      let s3ListBucketResource = s3ListBucketStatement.resource.add();

      s3Resource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
      s3Resource.descriptor = `${bucket.name}/${microserviceIdentifier}/${Core.AWS.IAM.Policy.ANY}`;
      s3ListBucketResource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
      s3ListBucketResource.descriptor = bucket.name;
    }

    let cognitoService = this.provisioning.services.find(CognitoIdentityService);
    let cognitoSyncPolicy = cognitoService.generateAllowCognitoSyncPolicy(['ListRecords', 'ListDatasets']);
    cognitoSyncPolicy.statement.list().forEach((statementInstance) => {
      policy.statement.add(statementInstance);
    });

    let invokeLambdaPolicy = this.generateAllowInvokeFunctionPolicy();
    invokeLambdaPolicy.statement.list().forEach((statementInstance) => {
      policy.statement.add(statementInstance);
    });

    return policy;
  }

  /**
   * @todo - use https://github.com/blakeembrey/pascal-case node package instead
   *
   * @param {String} actionName
   * @returns {String}
   * @private
   */
  _actionIdentifierToPascalCase(actionName) {
    let pascalCase = '';

    actionName.split('-').forEach((part) => {
      pascalCase += AbstractService.capitalizeFirst(part);
    });

    return pascalCase;
  }

  /**
   * @param {String} functionIdentifier
   * @returns {String}
   */
  _generateLambdaArn(functionIdentifier) {
    let region = this.provisioning.lambda.config.region;

    return `arn:aws:lambda:${region}:${this.awsAccountId}:function:${functionIdentifier}`;
  }

  /**
   * Allow Cognito and ApiGateway users to invoke these lambdas
   * @returns {Core.AWS.IAM.Policy}
   */
  generateAllowInvokeFunctionPolicy() {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();
    statement.action.add(Core.AWS.Service.LAMBDA, 'InvokeFunction');

    let resource = statement.resource.add();

    resource.updateFromArn(
      this._generateLambdaArn(this._getGlobalResourceMask())
    );

    return policy;
  }
}
