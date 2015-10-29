/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {S3Service} from './S3Service';
import {DynamoDBService} from './DynamoDBService';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {Action} from '../../Microservice/Metadata/Action';
import {Lambda} from '../../Property/Lambda';
import {IAMService} from './IAMService';

/**
 * Lambda service
 */
export class LambdaService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

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
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    let microservices = this.provisioning.property.microservices;

    this._createExecRoles(
      microservices
    )(function(execRoles) {
      this._config = {
        names: this._generateLambdasNames(microservices),
        executionRoles: execRoles,
      };
      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    let buckets = services.find(S3Service).config().buckets;
    let dynamoDbTablesNames = services.find(DynamoDBService).config().tablesNames;

    this._attachPolicyToExecRoles(
      buckets,
      this._config.executionRoles,
      dynamoDbTablesNames
    )(function(policies) {
      this._config.executionRolesPolicies = policies;
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
    let execRolePolicy = IAMService.getAssumeRolePolicy(Core.AWS.Service.LAMBDA); // role policy (definition) is common for all lambdas

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
   * @param {String} dynamoDbTablesNames
   * @returns {*}
   * @private
   */
  _attachPolicyToExecRoles(buckets, roles, dynamoDbTablesNames) {
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

        let policyName = this.generateAwsResourceName(
          this._actionIdentifierToPascalCase(lambdaIdentifier) + 'Policy',
          Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT,
          microserviceIdentifier
        );

        let policy = LambdaService.getAccessPolicy(microserviceIdentifier, buckets, dynamoDbTablesNames, this.env);

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
   * @param {String} dynamoDbTablesNames
   * @param {String} env
   *
   * @returns {Policy}
   */
  static getAccessPolicy(microserviceIdentifier, buckets, dynamoDbTablesNames, env) {
    let policy = new Core.AWS.IAM.Policy();

    let logsStatement = policy.statement.add();
    let logsAction = logsStatement.action.add();

    logsAction.service = Core.AWS.Service.CLOUD_WATCH_LOGS;
    logsAction.action = Core.AWS.IAM.Policy.ANY;

    let logsResource = logsStatement.resource.add();

    logsResource.service = Core.AWS.Service.CLOUD_WATCH_LOGS;
    logsResource.region = Core.AWS.IAM.Policy.ANY;
    logsResource.accountId = Core.AWS.IAM.Policy.ANY;
    logsResource.descriptor = Core.AWS.IAM.Policy.ANY;

    // avoid 'MalformedPolicyDocument: Policy statement must contain resources' error
    if (Object.keys(dynamoDbTablesNames).length > 0) {
      let dynamoDbStatement = policy.statement.add();
      let dynamoDbAction = dynamoDbStatement.action.add();

      dynamoDbAction.service = Core.AWS.Service.DYNAMO_DB;
      dynamoDbAction.action = Core.AWS.IAM.Policy.ANY;

      // Adding general statement
      let firstTableName = dynamoDbTablesNames[Object.keys(dynamoDbTablesNames)[0]];
      let tablesUniqueHash = AbstractService.extractBaseHashFromResourceName(firstTableName);
      let tablesResourceMask = DynamoDBService.getTablesResourceMask(tablesUniqueHash, env);

      let dynamoDbResource = dynamoDbStatement.resource.add();

      dynamoDbResource.service = Core.AWS.Service.DYNAMO_DB;
      dynamoDbResource.region = Core.AWS.IAM.Policy.ANY;
      dynamoDbResource.accountId = Core.AWS.IAM.Policy.ANY;
      dynamoDbResource.descriptor = `table/${tablesResourceMask}`;

      // @todo: remove when general statement tested
      //for (let modelName in dynamoDbTablesNames) {
      //  if (!dynamoDbTablesNames.hasOwnProperty(modelName)) {
      //    continue;
      //  }
      //
      //  let tableName = dynamoDbTablesNames[modelName];
      //  let dynamoDbResource = dynamoDbStatement.resource.add();
      //
      //  dynamoDbResource.service = Core.AWS.Service.DYNAMO_DB;
      //  dynamoDbResource.region = Core.AWS.IAM.Policy.ANY;
      //  dynamoDbResource.accountId = Core.AWS.IAM.Policy.ANY;
      //  dynamoDbResource.descriptor = `table/${tableName}`;
      //}
    }

    let s3Statement = policy.statement.add();

    let s3Action = s3Statement.action.add();

    s3Action.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
    s3Action.action = Core.AWS.IAM.Policy.ANY;

    for (let bucketSuffix in buckets) {
      if (!buckets.hasOwnProperty(bucketSuffix)) {
        continue;
      }

      let bucket = buckets[bucketSuffix];
      let s3Resource = s3Statement.resource.add();

      s3Resource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
      s3Resource.descriptor = `${bucket.name}/${microserviceIdentifier}/${Core.AWS.IAM.Policy.ANY}`;
    }

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

    actionName.split('-').forEach(function(part) {
      pascalCase += AbstractService.capitalizeFirst(part);
    });

    return pascalCase;
  }

  /**
   * Collect all lambdas arn from all microservices
   *
   * @param {Object} microservicesConfig
   * @returns {Array}
   */
  static getAllLambdasArn(microservicesConfig) {
    let lambdaArns = [];

    for (let microserviceIdentifier in microservicesConfig) {
      if (!microservicesConfig.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = microservicesConfig[microserviceIdentifier];

      for (let resourceName in microservice.resources) {
        if (!microservice.resources.hasOwnProperty(resourceName)) {
          continue;
        }

        let resourceActions = microservice.resources[resourceName];

        for (let actionName in resourceActions) {
          if (!resourceActions.hasOwnProperty(actionName)) {
            continue;
          }

          let action = resourceActions[actionName];

          if (action.type !== Action.LAMBDA) {
            continue;
          }

          lambdaArns.push(microservice.deployedServices.lambdas[action.identifier].FunctionArn);
        }
      }
    }

    return lambdaArns;
  }

  /**
   * Allow Cognito users to invoke these lambdas
   *
   * @param {Object} lambdaARNs
   * @returns {Core.AWS.IAM.Policy}
   */
  static generateAllowInvokeFunctionPolicy(lambdaARNs) {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();
    let action = statement.action.add();

    action.service = Core.AWS.Service.LAMBDA;
    action.action = 'InvokeFunction';

    for (let lambdaArnKey in lambdaARNs) {
      if (!lambdaARNs.hasOwnProperty(lambdaArnKey)) {
        continue;
      }

      let lambdaArn = lambdaARNs[lambdaArnKey];
      let resource = statement.resource.add();

      resource.updateFromArn(lambdaArn);
    }

    return policy;
  }
}
