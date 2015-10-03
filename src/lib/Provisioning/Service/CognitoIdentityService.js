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
import {Exception} from '../../Exception/Exception';
import {Action} from '../../Microservice/Metadata/Action';

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
  static get DEVELOPER_PROVIDER_NAME() {
    return 'deep.mg';
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
    )(function(identityPool) {
      this._config.identityPool = identityPool;
      this._ready = true;
    }.bind(this));

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

    this._setIdentityPoolRoles(
      this.config().identityPool
    )(function(roles) {
      this._readyTeardown = true;
      this._config.roles = roles;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CognitoIdentityService}
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    let lambdaArns = this.getAllLambdasArn(this.property.config.microservices);

    this._updateCognitoRolesPolicy(
      this._config.roles,
      lambdaArns
    )(function(policies) {
      this._config.postDeploy = {
        inlinePolicies: policies,
      };
      this._ready = true;
    }.bind(this));

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
      DeveloperProviderName: CognitoIdentityService.DEVELOPER_PROVIDER_NAME,
      SupportedLoginProviders: identityProviders,
    };

    let identityPool = null;
    let cognitoIdentity = this.provisioning.cognitoIdentity;
    let syncStack = new AwsRequestSyncStack();

    syncStack.push(cognitoIdentity.createIdentityPool(params), function(error, data) {
      if (error) {
        throw new FailedToCreateIdentityPoolException(identityPoolName, error);
      }

      identityPool = data;
    });

    return function(callback) {
      return syncStack.join().ready(function() {
        callback(identityPool);
      }.bind(this));
    }.bind(this);
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

      syncStack.push(iam.createRole(roleParams), function(error, data) {
        if (error) {
          throw new FailedToCreateIamRoleException(roleParams.RoleName, error);
        }

        roles[roleType] = data.Role;
      }.bind(this));
    }

    return function(callback) {
      return syncStack.join().ready(function() {
        let innerSyncStack = new AwsRequestSyncStack();
        let cognitoIdentity = this.provisioning.cognitoIdentity;

        let parameters = {
          IdentityPoolId: identityPool.IdentityPoolId,
          Roles: {
            authenticated: roles[CognitoIdentityService.ROLE_AUTH].Arn,
            unauthenticated: roles[CognitoIdentityService.ROLE_UNAUTH].Arn,
          },
        };

        innerSyncStack.push(cognitoIdentity.setIdentityPoolRoles(parameters), function(error, data) {
          if (error) {
            throw new FailedSettingIdentityPoolRolesException(identityPool.IdentityPoolName, error);
          }
        }.bind(this));

        innerSyncStack.join().ready(function() {
          callback(roles);
        }.bind(this));
      }.bind(this));
    }.bind(this);
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
   * @param {Object} lambdaARNs
   * @returns {function}
   * @private
   */
  _updateCognitoRolesPolicy(cognitoRoles, lambdaARNs) {
    let iam = this.provisioning.iam;
    let policies = {};
    let syncStack = new AwsRequestSyncStack();

    for (let cognitoRoleType in cognitoRoles) {
      if (!cognitoRoles.hasOwnProperty(cognitoRoleType)) {
        continue;
      }

      let cognitoRole = cognitoRoles[cognitoRoleType];
      let lambdasForRole = lambdaARNs[cognitoRoleType];

      // skip role if there are no lambdas to add
      if (lambdasForRole.length <= 0) {
        continue;
      }

      let policy = CognitoIdentityService.getAccessPolicyForResources(lambdasForRole);

      let params = {
        PolicyDocument: policy.toString(),
        PolicyName: this.generateAwsResourceName(
          cognitoRoleType + 'Policy',
          Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT
        ),
        RoleName: cognitoRole.RoleName,
      };

      syncStack.push(iam.putRolePolicy(params), function(error, data) {
        if (error) {
          throw new FailedAttachingPolicyToRoleException(params.PolicyName, params.RoleName, error);
        }

        policies[params.RoleName] = policy;
      }.bind(this));
    }

    return function(callback) {
      return syncStack.join().ready(function() {
        callback(policies);
      }.bind(this));
    }.bind(this);
  }

  /**
   * Allow Cognito users to invoke these lambdas
   *
   * @param {Object} lambdaARNs
   * @returns {Core.AWS.IAM.Policy}
   */
  static getAccessPolicyForResources(lambdaARNs) {
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

  /**
   * @temp - allow all lambdas to be invoked by unauth users
   *
   * Collect all lambdas arn from all microservices
   *
   * @param {Object} microservicesConfig
   * @returns {Object}
   */
  getAllLambdasArn(microservicesConfig) {
    let lambdaArns = {};
    lambdaArns[CognitoIdentityService.ROLE_AUTH] = [];
    lambdaArns[CognitoIdentityService.ROLE_UNAUTH] = [];

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

          let actionIdentifier = `${resourceName}-${action.name}`;
          let lambdaArn = microservice.deployedServices.lambdas[actionIdentifier].FunctionArn;

          lambdaArns[CognitoIdentityService.ROLE_UNAUTH].push(lambdaArn);
          lambdaArns[CognitoIdentityService.ROLE_AUTH].push(lambdaArn);
        }
      }
    }

    return lambdaArns;
  }

  /**
   * @returns {String}
   */
  generateName() {
    return this.generateAwsResourceName('IdentityPool', Core.AWS.Service.COGNITO_IDENTITY);
  }
}
