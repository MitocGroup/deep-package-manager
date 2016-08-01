/**
 * Created by AlexanderC on 5/27/15.
 */

/*eslint  max-statements: 0*/

'use strict';

import {AbstractService} from './AbstractService';
import {S3Service} from './S3Service';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {Inflector} from '../../Helpers/Inflector';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {Action} from '../../Microservice/Metadata/Action';
import {IAMService} from './IAMService';
import objectMerge from 'object-merge';
import {_extend as extend} from 'util';
import {CognitoIdentityService} from './CognitoIdentityService';
import {CloudWatchLogsService} from './CloudWatchLogsService';
import {CloudWatchEventsService} from './CloudWatchEventsService';
import {SQSService} from './SQSService';
import {ActionFlags} from '../../Microservice/Metadata/Helpers/ActionFlags';
import {ESService} from './ESService';
import {FailedToCreateScheduledEventException} from './Exception/FailedToCreateScheduledEventException';
import {FailedToAttachScheduledEventException} from './Exception/FailedToAttachScheduledEventException';
import {CognitoIdentityProviderService} from './CognitoIdentityProviderService';

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

        let execRole = execRoles[microserviceIdentifier];

        deployedRoles.push(execRole.RoleName);
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
      Core.AWS.Region.EU_FRANKFURT,
      Core.AWS.Region.ASIA_PACIFIC_TOKYO,
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _setup(services) {
    let microservices = this.provisioning.property.microservices;

    this._createExecRoles(
      microservices
    )((execRoles) => {
      let lambdaNames = this._generateLambdasNames(microservices);

      this._config.names = this.isUpdate
        ? objectMerge(this._config.names, lambdaNames)
        : lambdaNames;

      this._config.executionRoles = this.isUpdate
        ? objectMerge(this._config.executionRoles, execRoles)
        : execRoles;

      this._ready = true;
    });

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _postProvision(services) {
    let buckets = services.find(S3Service).config().buckets;

    this._attachPolicyToExecRoles(
      buckets,
      this._config.executionRoles
    )((policies) => {
      this._config.executionRolesPolicies = this.isUpdate
        ? extend(this._config.executionRolesPolicies, policies)
        : policies;

      this._readyTeardown = true;
    });

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {LambdaService}
   */
  _postDeployProvision(services) {
    this._attachScheduledEvents((crons) => {
      this._config.crons = crons;

      this._ready = true;
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @private
   */
  _attachScheduledEvents(cb) {
    let microservices = this._provisioning.property.microservices;
    let crons = {};

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];

      let actions = microservice.resources.actions;

      for (let actionKey in actions) {
        if (!actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = actions[actionKey];

        if (action.type === Action.LAMBDA && action.cron) {
          let lambdaName = this.generateAwsResourceName(
            Inflector.pascalCase(action.identifier),
            Core.AWS.Service.LAMBDA,
            microservice.identifier
          );

          crons[lambdaName] = {
            cron: action.cron,
            payload: action.cronPayload,
            lambdaArn: this._generateLambdaArn(lambdaName),
            eventArn: null,
          };
        }
      }
    }

    this._createScheduledEvents(crons).ready(() => {
      cb(crons);
    });
  }

  /**
   * @param {Object} crons
   * @returns {WaitFor}
   * @private
   */
  _createScheduledEvents(crons) {
    let syncStack = new AwsRequestSyncStack();
    let cwe = this.provisioning.cloudWatchEvents;
    let lambda = this.provisioning.lambda;

    for (let lambdaName in crons) {
      if (!crons.hasOwnProperty(lambdaName)) {
        continue;
      }

      let cronData = crons[lambdaName];
      let cronString = cronData.cron;
      let lambdaArn = cronData.lambdaArn;

      let payload = {
        Name: lambdaName,
        Description: `Schedule ${lambdaArn} (${cronString})`,
        ScheduleExpression: `cron(${cronString})`,
        State: 'ENABLED',
      };

      syncStack.push(cwe.putRule(payload), (error, data) => {
        if (error) {
          throw new FailedToCreateScheduledEventException(lambdaName, error);
        }

        crons[lambdaName].eventArn = data.RuleArn;
      });

      let permissionsPayload = {
        Action: `${Core.AWS.Service.LAMBDA}:InvokeFunction`,
        Principal: Core.AWS.Service.identifier(Core.AWS.Service.CLOUD_WATCH_EVENTS),
        FunctionName: lambdaArn,
        StatementId: lambdaName,
      };

      syncStack.level(1).push(lambda.addPermission(permissionsPayload), (error) => {
        if (error && error.code !== 'ResourceConflictException') {
          throw new FailedToAttachScheduledEventException(lambdaName, error);
        }
      });

      let targetPayload = {
        Rule: lambdaName,
        Targets: [
          {
            Arn: lambdaArn,
            Id: lambdaName,
          },
        ],
      };

      if (cronData.payload) {
        targetPayload.Targets[0].Input = JSON.stringify(cronData.payload);
      }

      syncStack.level(1).push(cwe.putTargets(targetPayload), (error) => {
        if (error) {
          throw new FailedToAttachScheduledEventException(lambdaName, error);
        }
      });
    }

    return syncStack.join();
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   */
  static getAssumeRolePolicy() {
    let rolePolicy = new Core.AWS.IAM.Policy();

    let statement = rolePolicy.statement.add();
    statement.principal = {
      Service: Core.AWS.Service.identifier(Core.AWS.Service.CLOUD_WATCH_EVENTS),
    };

    let action = statement.action.add();
    action.service = Core.AWS.Service.LAMBDA;
    action.action = 'InvokeFunction';

    return rolePolicy;
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
      let doUploadMicroserviceExecRole = microservice.resources.actions.reduce((isLambda, action) => {
        return isLambda || action.type === Action.LAMBDA;
      }, false);

      if (doUploadMicroserviceExecRole) {
        let roleName = this.generateAwsResourceName(
          Inflector.pascalCase(microservice.identifier) + 'LambdaExec',
          Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT,
          microservice.identifier
        );

        let params = {
          AssumeRolePolicyDocument: execRolePolicy.toString(),
          RoleName: roleName,
        };

        if (this._isIamRoleNew(roleName)) {
          syncStack.push(iam.createRole(params), (error, data) => {
            if (error) {
              throw new FailedToCreateIamRoleException(roleName, error);
            }

            execRoles[microservice.identifier] = data.Role;
          });
        }
      }
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(execRoles);
      });
    };
  }

  /**
   * @param {Object<Instance>} microservices
   * @param {Function} filter
   * @returns {Object}
   * @private
   */
  _generateLambdasNames(microservices, filter = () => true) {
    let names = {};

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];

      names[microservice.identifier] = {};

      let actions = microservice.resources.actions.filter(filter);

      for (let actionKey in actions) {
        if (!actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = actions[actionKey];

        if (action.type === Action.LAMBDA) {
          names[microservice.identifier][action.identifier] = this.generateAwsResourceName(
            Inflector.pascalCase(action.identifier),
            Core.AWS.Service.LAMBDA,
            microservice.identifier
          );
        }
      }
    }

    return names;
  }

  /**
   * Resolve DeepRN into ARN
   *
   * @example: @deep-account:user:create -> DeepDevUserCreate075234e258d
   * @param {String} resourceName
   * @returns {*}
   */
  resolveDeepResourceName(resourceName) {
    let parts = resourceName.match(/^@([^:]+):([^:]+):([^:]+)$/);
    let names = this._config.names;

    if (!parts) {
      return null;
    }

    let microserviceIdentifier = parts[1];
    let actionIdentifier = `${parts[2]}-${parts[3]}`;
    let functionName = (names[microserviceIdentifier] || {})[actionIdentifier];

    return functionName ?
      this._generateLambdaArn(functionName) :
      null;
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
    let rootMicroservice = this.property.rootMicroservice;

    for (let microserviceIdentifier in roles) {
      if (!roles.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let execRole = roles[microserviceIdentifier];

      if (this._isIamRoleNew(execRole.RoleName)) {
        let policyName = this.generateAwsResourceName(
          Inflector.pascalCase(microserviceIdentifier) + 'LambdaExecPolicy',
          Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT,
          microserviceIdentifier
        );

        let policy = this._getAccessPolicy(
          microserviceIdentifier,
          buckets,
          microserviceIdentifier === rootMicroservice.identifier
        );

        let params = {
          PolicyDocument: policy.toString(),
          PolicyName: policyName,
          RoleName: execRole.RoleName,
        };

        syncStack.push(iam.putRolePolicy(params), (error, data) => {
          if (error) {
            throw new FailedAttachingPolicyToRoleException(policyName, execRole.RoleName, error);
          }

          policies[execRole.RoleName] = policy;
        });
      }
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(policies);
      });
    };
  }

  /**
   * Allows lambda function access to all microservice resources (FS s3 buckets, DynamoDD tables, etc.)
   *
   * @param {String} microserviceIdentifier
   * @param {Array} buckets
   * @param {Boolean} rootLambda
   *
   * @returns {Policy}
   */
  _getAccessPolicy(microserviceIdentifier, buckets, rootLambda = false) {
    let policy = new Core.AWS.IAM.Policy();

    let cloudWatchLogsService = this.provisioning.services.find(CloudWatchLogsService);
    policy.statement.add(cloudWatchLogsService.generateAllowFullAccessStatement());

    let cloudWatchEventsService = this.provisioning.services.find(CloudWatchEventsService);
    policy.statement.add(cloudWatchEventsService.generateAllowEffectEventsRulesStatement());

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
    let s3ReadBucketStatement = policy.statement.add();

    s3Statement.action.add(Core.AWS.Service.SIMPLE_STORAGE_SERVICE, Core.AWS.IAM.Policy.ANY);
    s3ListBucketStatement.action.add(Core.AWS.Service.SIMPLE_STORAGE_SERVICE, 'ListBucket');
    s3ReadBucketStatement.action.add(Core.AWS.Service.SIMPLE_STORAGE_SERVICE, 'GetObject');
    s3ReadBucketStatement.action.add(Core.AWS.Service.SIMPLE_STORAGE_SERVICE, 'HeadObject');

    for (let bucketSuffix in buckets) {
      if (!buckets.hasOwnProperty(bucketSuffix)) {
        continue;
      }

      let bucket = buckets[bucketSuffix];

      if (bucketSuffix === S3Service.PUBLIC_BUCKET) {
        let s3Resource = s3Statement.resource.add();

        s3Resource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
        s3Resource.descriptor = rootLambda ?
          `${bucket.name}/${Core.AWS.IAM.Policy.ANY}` :
          `${bucket.name}/${microserviceIdentifier}/${Core.AWS.IAM.Policy.ANY}`;
      } else {
        let s3ResourceSystem = s3Statement.resource.add();
        let s3ResourceTmp = s3Statement.resource.add();
        let s3ResourceShared = s3Statement.resource.add();

        s3ResourceSystem.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
        s3ResourceSystem.descriptor = `${bucket.name}/${S3Service.PRIVATE_BUCKET}/` +
          `${microserviceIdentifier}/${Core.AWS.IAM.Policy.ANY}`;

        s3ResourceTmp.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
        s3ResourceTmp.descriptor = `${bucket.name}/${S3Service.TMP_BUCKET}/` +
          `${microserviceIdentifier}/${Core.AWS.IAM.Policy.ANY}`;

        s3ResourceShared.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
        s3ResourceShared.descriptor = `${bucket.name}/${S3Service.SHARED_BUCKET}/` +
          `${microserviceIdentifier}/${Core.AWS.IAM.Policy.ANY}`;

        let s3ReadBucketResource = s3ReadBucketStatement.resource.add();

        s3ReadBucketResource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
        s3ReadBucketResource.descriptor = `${bucket.name}/${S3Service.SHARED_BUCKET}/${Core.AWS.IAM.Policy.ANY}`;
      }

      let s3ListBucketResource = s3ListBucketStatement.resource.add();

      s3ListBucketResource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
      s3ListBucketResource.descriptor = bucket.name;
    }

    let cognitoService = this.provisioning.services.find(CognitoIdentityService);
    policy.statement.add(
      cognitoService.generateAllowCognitoSyncStatement(['ListRecords', 'ListDatasets'], LambdaService)
    );
    policy.statement.add(cognitoService.generateAllowDescribeIdentityStatement(LambdaService));

    policy.statement.add(this.generateAllowActionsStatement(['getFunctionConfiguration', 'InvokeFunction']));

    let sqsService = this.provisioning.services.find(SQSService);
    policy.statement.add(sqsService.generateAllowActionsStatement([
      'SendMessage', 'SendMessageBatch', 'ReceiveMessage',
      'DeleteMessage', 'DeleteMessageBatch', 'GetQueueAttributes'
    ]));

    let esService = this.provisioning.services.find(ESService);
    policy.statement.add(esService.generateAllowActionsStatement([
      'ESHttpGet', 'ESHttpHead', 'ESHttpDelete', 'ESHttpPost', 'ESHttpPut',
      'DescribeElasticsearchDomain', 'DescribeElasticsearchDomains', 'ListDomainNames'
    ]));

    let cognitoIdpService = this.provisioning.services.find(CognitoIdentityProviderService);
    policy.statement.add(cognitoIdpService.generateAllowActionsStatement([
      'AdminGetUser', 'AdminConfirmSignUp',
    ]));

    // @todo: move it to ElastiCacheService?
    let ec2Statement = policy.statement.add();
    ec2Statement.action.add(Core.AWS.Service.EC2, 'CreateNetworkInterface');
    ec2Statement.action.add(Core.AWS.Service.EC2, 'DescribeNetworkInterfaces');
    ec2Statement.action.add(Core.AWS.Service.EC2, 'DeleteNetworkInterface');
    ec2Statement.resource.add().any();

    // @todo: move it to DynamoDBService?
    let dynamoDbECStatement = policy.statement.add();
    dynamoDbECStatement.action.add(Core.AWS.Service.CLOUD_WATCH, 'setAlarmState');
    dynamoDbECStatement.resource.add().any();

    if (this._allowAlterIamService(microserviceIdentifier)) {
      let iamService = this.provisioning.services.find(IAMService);
      policy.statement.add(iamService.generateAllowAlterIamStatement());
    }

    return policy;
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
   * @param {String} microserviceIdentifier
   * @returns {Boolean}
   * @private
   */
  _allowAlterIamService(microserviceIdentifier) {
    let accountMicroservice = this.provisioning.property.accountMicroservice;

    return accountMicroservice && accountMicroservice.identifier === microserviceIdentifier;
  }

  /**
   * @param {Object[]} actions
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowActionsStatement(actions = ['InvokeFunction']) {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    actions.forEach((actionName) => {
      statement.action.add(Core.AWS.Service.LAMBDA, actionName);
    });

    statement.resource.add().updateFromArn(
      this._generateLambdaArn(this._getGlobalResourceMask())
    );

    return statement;
  }

  /**
   * @param {Function} filter
   * @returns {String[]}
   */
  extractFunctionIdentifiers(filter = () => true) {
    let lambdaIdentifiers = [];

    let privateLambdasObj = this._generateLambdasNames(
      this._provisioning.property.microservices,
      filter
    );

    for (let k in privateLambdasObj) {
      if (!privateLambdasObj.hasOwnProperty(k)) {
        continue;
      }

      let privateLambdasObjNested = privateLambdasObj[k];

      for (let nk in privateLambdasObjNested) {
        if (!privateLambdasObjNested.hasOwnProperty(nk)) {
          continue;
        }

        lambdaIdentifiers.push(privateLambdasObjNested[nk]);
      }
    }

    return lambdaIdentifiers;
  }

  /**
   * Deny Cognito and ApiGateway users to invoke these lambdas
   *
   * @params {Function} filter
   * @returns {Core.AWS.IAM.Statement|null}
   */
  generateDenyInvokeFunctionStatement(filter = ActionFlags.NON_DIRECT_ACTION_FILTER) {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();
    statement.effect = statement.constructor.DENY;
    statement.action.add(Core.AWS.Service.LAMBDA, 'InvokeFunction');

    let lambdaArns = this.extractFunctionIdentifiers(filter);

    if (lambdaArns.length <= 0) {
      return null;
    }

    lambdaArns.forEach((lambdaArn) => {
      statement.resource.add().updateFromArn(
        this._generateLambdaArn(lambdaArn)
      );
    });

    return statement;
  }
}
