/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {FailedToCreateIdentityPoolException} from './Exception/FailedToCreateIdentityPoolException';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedSettingIdentityPoolRolesException} from './Exception/FailedSettingIdentityPoolRolesException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {FailedToUpdateIdentityPoolException} from './Exception/FailedToUpdateIdentityPoolException';
import {CognitoIdentityProviderService} from './CognitoIdentityProviderService';
import {Exception} from '../../Exception/Exception';
import {LambdaService} from './LambdaService';
import {APIGatewayService} from './APIGatewayService';
import {SQSService} from './SQSService';
import {IAMService} from './IAMService';

/**
 * Cognito service
 */
export class CognitoIdentityService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {string}
   */
  static get ROLE_AUTH() {
    return 'authenticated';
  }

  /**
   * @returns {string}
   */
  static get ROLE_UNAUTH() {
    return 'unauthenticated';
  }

  /**
   * @returns {Array}
   */
  static get ROLE_TYPES() {
    return [
      CognitoIdentityService.ROLE_AUTH,
      CognitoIdentityService.ROLE_UNAUTH,
    ];
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.COGNITO_IDENTITY;
  }

  /**
   * @returns {string[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.US_EAST_N_VIRGINIA,
      Core.AWS.Region.EU_IRELAND,
      Core.AWS.Region.ASIA_PACIFIC_TOKYO,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CognitoIdentityService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    let globalsConfig = this.property.config.globals;
    let identityProviders = globalsConfig.security && globalsConfig.security.identityProviders
      ? globalsConfig.security.identityProviders : {};

    this._createIdentityPool(
      identityProviders
    )((identityPool) => {
      this._config.identityPool = identityPool;
      this._ready = true;
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CognitoIdentityService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    let iamInstance = services.find(IAMService);
    let cognitoIdpService = services.find(CognitoIdentityProviderService);
    let cognitoIdpConfig = cognitoIdpService.config();
    let oidcProvider = iamInstance.config().identityProvider;
    let changeSet = {};

    if (oidcProvider) {
      changeSet.OpenIdConnectProviderARNs = [
        oidcProvider.OpenIDConnectProviderArn,
      ];
    }

    if (cognitoIdpService.isCognitoPoolEnabled) {
      changeSet.CognitoIdentityProviders = [
        {
          ProviderName: cognitoIdpConfig.ProviderName,
          ClientId: cognitoIdpConfig.UserPoolClient.ClientId,
        },
      ];
    }

    this._updateIdentityPool(this._config.identityPool, changeSet, (data) => {
      this._config.identityPool = data;

      this._setIdentityPoolRoles(this._config.identityPool)((roles) => {
        this._readyTeardown = true;
        this._config.roles = roles;
      });
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CognitoIdentityService}
   */
  _postDeployProvision(services) {
    let apiGatewayInstance = services.find(APIGatewayService);

    this._updateCognitoRolesPolicy(
      this._config.roles,
      apiGatewayInstance.getAllEndpointsArn()
    )((policies) => {
      this._config.postDeploy = {
        inlinePolicies: policies,
      };

      this._ready = true;
    });

    return this;
  }

  /**
   * @param {Object} identityProviders
   * @returns {function}
   * @private
   */
  _createIdentityPool(identityProviders) {
    let identityPoolName = this.generateName();

    let params = {
      AllowUnauthenticatedIdentities: true,
      IdentityPoolName: identityPoolName,
      SupportedLoginProviders: identityProviders,
    };

    let identityPool = null;
    let cognitoIdentity = this.provisioning.cognitoIdentity;
    let syncStack = new AwsRequestSyncStack();

    syncStack.push(cognitoIdentity.createIdentityPool(params), (error, data) => {
      if (error) {
        throw new FailedToCreateIdentityPoolException(identityPoolName, error);
      }

      identityPool = data;
    });

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(identityPool);
      });
    };
  }

  /**
   * @param {Object} identityPool
   * @param {Object} changeSet
   * @param {Function} callback
   * @returns {Function}
   * @private
   */
  _updateIdentityPool(identityPool, changeSet, callback) {
    if (Object.keys(changeSet).length === 0) {
      callback(identityPool);
      return;
    }

    let cognitoIdentity = this.provisioning.cognitoIdentity;
    let params = Object.assign(identityPool, changeSet);

    cognitoIdentity.updateIdentityPool(params, (error, data) => {
      if (error) {
        throw new FailedToUpdateIdentityPoolException(params.IdentityPoolName, error);
      }

      callback(data);
    });
  }

  /**
   * @param {String} identityPool
   * @returns {function}
   * @private
   */
  _setIdentityPoolRoles(identityPool) {
    let iam = this.provisioning.iam;
    let roles = {};
    let syncStack = new AwsRequestSyncStack();

    for (let roleKey in CognitoIdentityService.ROLE_TYPES) {
      if (!CognitoIdentityService.ROLE_TYPES.hasOwnProperty(roleKey)) {
        continue;
      }

      let roleType = CognitoIdentityService.ROLE_TYPES[roleKey];

      let roleParams = {
        AssumeRolePolicyDocument: this._getAssumeRolePolicy(identityPool, roleType).toString(),
        RoleName: this.generateAwsResourceName(roleType, Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT),
      };

      syncStack.push(iam.createRole(roleParams), (error, data) => {
        if (error) {
          throw new FailedToCreateIamRoleException(roleParams.RoleName, error);
        }

        roles[roleType] = data.Role;
      });
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        let innerSyncStack = new AwsRequestSyncStack();
        let cognitoIdentity = this.provisioning.cognitoIdentity;

        let parameters = {
          IdentityPoolId: identityPool.IdentityPoolId,
          Roles: {
            authenticated: roles[CognitoIdentityService.ROLE_AUTH].Arn,
            unauthenticated: roles[CognitoIdentityService.ROLE_UNAUTH].Arn,
          },
        };

        innerSyncStack.push(cognitoIdentity.setIdentityPoolRoles(parameters), (error, data) => {
          if (error) {
            throw new FailedSettingIdentityPoolRolesException(identityPool.IdentityPoolName, error);
          }
        });

        innerSyncStack.join().ready(() => {
          callback(roles);
        });
      });
    };
  }

  /**
   * IAM role that is assumed by created Cognito identity pool
   *
   * @param identityPool
   * @param roleType
   * @returns {*}
   */
  _getAssumeRolePolicy(identityPool, roleType) {
    if (CognitoIdentityService.ROLE_TYPES.indexOf(roleType) === -1) {
      throw new Exception(`Unknown role type ${roleType}.`);
    }

    let rolePolicy = new Core.AWS.IAM.Policy();

    let statement = rolePolicy.statement.add();

    let action = statement.action.add();
    action.service = Core.AWS.Service.SECURITY_TOKEN_SERVICE;
    action.action = 'AssumeRoleWithWebIdentity';

    statement.principal = {
      Federated: Core.AWS.Service.identifier(Core.AWS.Service.COGNITO_IDENTITY),
    };

    statement.condition = {
      StringEquals: {
        'cognito-identity.amazonaws.com:aud': identityPool.IdentityPoolId,
      },
      'ForAnyValue:StringLike': {
        'cognito-identity.amazonaws.com:amr': roleType,
      },
    };

    return rolePolicy;
  }

  /**
   * Adds inline policies to Cognito auth and unauth roles
   *
   * @param {Object} cognitoRoles
   * @param {Object} endpointsARNs
   * @returns {function}
   * @private
   */
  _updateCognitoRolesPolicy(cognitoRoles, endpointsARNs) {
    let iam = this.provisioning.iam;
    let policies = {};
    let syncStack = new AwsRequestSyncStack();

    for (let cognitoRoleType in cognitoRoles) {
      if (!cognitoRoles.hasOwnProperty(cognitoRoleType)) {
        continue;
      }

      let cognitoRole = cognitoRoles[cognitoRoleType];

      let lambdaService = this.provisioning.services.find(LambdaService);
      let sqsService = this.provisioning.services.find(SQSService);

      let policy = new Core.AWS.IAM.Policy();
      policy.statement.add(lambdaService.generateAllowActionsStatement());
      policy.statement.add(APIGatewayService.generateAllowInvokeMethodStatement(endpointsARNs));
      policy.statement.add(this.generateAllowCognitoSyncStatement(['ListRecords', 'UpdateRecords', 'ListDatasets']));
      policy.statement.add(sqsService.generateAllowActionsStatement());

      let denyLambdaStatement = lambdaService.generateDenyInvokeFunctionStatement();

      if (denyLambdaStatement) {
        policy.statement.add(denyLambdaStatement);
      }

      let params = {
        PolicyDocument: policy.toString(),
        PolicyName: this.generateAwsResourceName(
          cognitoRoleType + 'Policy',
          Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT
        ),
        RoleName: cognitoRole.RoleName,
      };

      syncStack.push(iam.putRolePolicy(params), (error, data) => {
        if (error) {
          throw new FailedAttachingPolicyToRoleException(params.PolicyName, params.RoleName, error);
        }

        policies[params.RoleName] = policy;
      });
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(policies);
      });
    };
  }

  /**
   * Allow Cognito users to list / push data to CognitoSync service
   *
   * @param {Array} allowedActions
   * @param {Function} targetService
   *
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowCognitoSyncStatement(allowedActions = [Core.AWS.IAM.Policy.ANY], targetService = CognitoIdentityService) {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();

    allowedActions.forEach((actionName) => {
      statement.action.add(Core.AWS.Service.COGNITO_SYNC, actionName);
    });

    let identityPoolId = this._config.identityPool.IdentityPoolId;
    let resourceIdentifier = 'identitypool/' + identityPoolId + '/identity/${cognito-identity.amazonaws.com:sub}/*';

    if (targetService === LambdaService) {
      resourceIdentifier = 'identitypool/' + identityPoolId + '/identity/*';
    }

    statement.resource.add(
      Core.AWS.Service.COGNITO_SYNC,
      this.provisioning.cognitoIdentity.config.region,
      this.awsAccountId,
      resourceIdentifier
    );

    return statement;
  }

  /**
   * Allow to execute DescribeIdentity on Cognito identity pool
   *
   * @param {Function} targetService
   *
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowDescribeIdentityStatement(targetService = CognitoIdentityService) {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();

    statement.action.add(Core.AWS.Service.COGNITO_IDENTITY, 'DescribeIdentity');

    statement.resource.add(
      Core.AWS.Service.COGNITO_IDENTITY,
      this.provisioning.cognitoIdentity.config.region,
      this.awsAccountId,
      'identitypool/'
    );

    let condition = {};
    condition.StringEquals = {};

    // @todo - find out why we cannot setup this condition for DescribeIdentity
    //condition.StringEquals["cognito-identity.amazonaws.com:aud"] = this._config.identityPool.IdentityPoolId;

    if (targetService === CognitoIdentityService) {
      condition.StringEquals["cognito-identity.amazonaws.com:sub"] = ["${cognito-identity.amazonaws.com:sub}"];
    }

    if (Object.keys(condition.StringEquals).length > 0) {
      statement.condition = condition;
    }

    return statement;
  }

  /**
   * @returns {String}
   */
  generateName() {
    return this.generateAwsResourceName('IdentityPool', Core.AWS.Service.COGNITO_IDENTITY);
  }
}
