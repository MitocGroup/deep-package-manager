/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {FailedToCreateIdentityPoolException} from './Exception/FailedToCreateIdentityPoolException';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedSettingIdentityPoolRolesException} from './Exception/FailedSettingIdentityPoolRolesException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {FailedToUpdateIdentityPoolException} from './Exception/FailedToUpdateIdentityPoolException';
import {CognitoIdentityProviderService} from './CognitoIdentityProviderService';
import {Exception} from '../../Exception/Exception';
import {LambdaService} from './LambdaService';
import {IAMService} from './IAMService';
import {AbstractProvider} from './Helper/PolicyProvider/AbstractProvider';
import {SQSService} from './SQSService';
import {APIGatewayService} from './APIGatewayService';
import {MissingPolicyProviderMethodException} from './Exception/MissingPolicyProviderMethodException';
import {FailedToDescribeIdentityPoolException} from './Exception/FailedToDescribeIdentityPoolException';

/**
 * Cognito service
 */
export class CognitoIdentityService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._policyProvider = null;
  }
  
  /**
   * @returns {AbstractProvider|*}
   */
  get policyProvider() {
    if (!this._policyProvider) {
      this._policyProvider = AbstractProvider.create(this.provisioning);
    }
    
    return this._policyProvider;
  }

  /**
   * @returns {string}
   */
  static get ROLE_AUTH() {
    return 'cognitoAuthenticated';
  }

  /**
   * @returns {string}
   */
  static get ROLE_UNAUTH() {
    return 'cognitoUnauthenticated';
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
      Core.AWS.Region.AP_NORTHEAST_TOKYO,
      Core.AWS.Region.AP_NORTHEAST_SEOUL,
      Core.AWS.Region.AP_SOUTHEAST_SYDNEY,
      Core.AWS.Region.AP_SOUTH_MUMBAI,
      Core.AWS.Region.EU_CENTRAL_FRANKFURT,
      Core.AWS.Region.EU_WEST_IRELAND,
      Core.AWS.Region.EU_WEST_LONDON,
      Core.AWS.Region.US_EAST_VIRGINIA,
      Core.AWS.Region.US_EAST_OHIO,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CognitoIdentityService}
   * @private
   */
  _setup(services) {
    this._ensureIdentityPool().then(identityPool => {
      this._config.identityPool = identityPool;
      this._ready = true;
    });

    return this;
  }

  /**
   * @returns {Promise}
   * @private
   */
  _postProvision() {
    return this._attachCognitoIdentityProviders(this._config.identityPool || null)
      .then(data => {
        this._config.identityPool = data;

        if (this._isUpdate) {
          return this._getIdentityPoolRoles(this._config.identityPool.IdentityPoolId);
        } else {
          return this._setIdentityPoolRoles(this._config.identityPool);
        }
      })
      .then(roles => {
        this._config.roles = roles;

        this._readyTeardown = true;
      });
  }

  /**
   * @param {String} identityPoolId
   * @returns {Promise}
   * @private
   */
  _getIdentityPoolRoles(identityPoolId) {
    let cognitoIdentity = this.provisioning.cognitoIdentity;
    let iam = this.provisioning.iam;

    let payload = {IdentityPoolId: identityPoolId,};

    return cognitoIdentity.getIdentityPoolRoles(payload)
      .promise()
      .then(response => {
        let rolesMap = response.Roles;
        let rolesObj = {};

        return Promise.all(
          Object.keys(rolesMap).map(roleType => {
            let roleName = rolesMap[roleType].replace(/^[^\/]+\//, '');

            return iam.getRole({RoleName: roleName,})
              .promise()
              .then(response => {
                rolesObj[roleType] = response.Role;
              });
          })
        ).then(() => {
          this._config.roles = rolesObj;

          return rolesObj;
        });
      })
      .catch(error => {
        setImmediate(() => {
          throw new FailedSettingIdentityPoolRolesException(this._config.identityPool.IdentityPoolName, error);
        });
      });
  }

  /**
   * @param {*} identityPool
   * @returns {Promise}
   * @private
   */
  _attachCognitoIdentityProviders(identityPool) {
    let services = this.provisioning.services;
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
      changeSet.CognitoIdentityProviders = [];

      for (let clientName in cognitoIdpConfig.userPoolClients) {
        if (!cognitoIdpConfig.userPoolClients.hasOwnProperty(clientName)) {
          continue;
        }

        let client = cognitoIdpConfig.userPoolClients[clientName];

        changeSet.CognitoIdentityProviders.push({
          ProviderName: cognitoIdpConfig.providerName,
          ClientId: client.ClientId,
        });
      }
    }

    return this._updateIdentityPool(identityPool, changeSet);
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CognitoIdentityService}
   * @private
   */
  _postDeployProvision(/* services */) {
    this._updateCognitoRolesPolicy(this._config.roles)
      .then(policies => {
        this._config.postDeploy = {
          inlinePolicies: policies,
        };

        this._ready = true;
      });

    return this;
  }

  /**
   * @returns {Promise}
   * @private
   */
  _ensureIdentityPool() {
    let securityConfig = this.securityConfig;
    let identityPoolId = this._config.identityPool ? this._config.identityPool.IdentityPoolId : null;

    if (!identityPoolId) {
      return this._createIdentityPool(securityConfig.identityProviders);
    }

    let cognitoIdentity = this.provisioning.cognitoIdentity;

    return cognitoIdentity.describeIdentityPool({
      IdentityPoolId: identityPoolId,
    }).promise().catch(error => {
      setImmediate(() => {
        throw new FailedToDescribeIdentityPoolException(identityPoolId, error);
      });
    });
  }

  /**
   * @param {Object} identityProviders
   * @returns {Promise}
   * @private
   */
  _createIdentityPool(identityProviders) {
    let identityPoolName = this.generateName();

    let params = {
      AllowUnauthenticatedIdentities: true,
      IdentityPoolName: identityPoolName,
      SupportedLoginProviders: identityProviders,
    };

    let cognitoIdentity = this.provisioning.cognitoIdentity;

    return cognitoIdentity.createIdentityPool(params)
      .promise()
      .catch(error => {
        setImmediate(() => {
          throw new FailedToCreateIdentityPoolException(identityPoolName, error);
        });
      });
  }

  /**
   * @param {Object} identityPool
   * @param {Object} changeSet
   * @returns {Promise}
   * @private
   */
  _updateIdentityPool(identityPool, changeSet) {
    if (!identityPool) {
      return Promise.reject(new Error(`IdentityPool instance is required when updating it.`));
    }

    if (Object.keys(changeSet).length === 0) {
      return Promise.resolve(identityPool);
    }

    let cognitoIdentity = this.provisioning.cognitoIdentity;
    let params = Object.assign(identityPool, changeSet);

    return cognitoIdentity.updateIdentityPool(params)
      .promise()
      .catch(error => {
        setImmediate(() => {
          throw new FailedToUpdateIdentityPoolException(params.IdentityPoolName, error);
        });
      });
  }

  /**
   * @param {String} identityPool
   * @returns {Promise}
   * @private
   */
  _setIdentityPoolRoles(identityPool) {
    let iam = this.provisioning.iam;
    let roles = {};
    let promiseStack = [];

    for (let roleKey in CognitoIdentityService.ROLE_TYPES) {
      if (!CognitoIdentityService.ROLE_TYPES.hasOwnProperty(roleKey)) {
        continue;
      }

      let roleType = CognitoIdentityService.ROLE_TYPES[roleKey];

      let roleParams = {
        AssumeRolePolicyDocument: this._getAssumeRolePolicy(identityPool, roleType).toString(),
        RoleName: this.generateAwsResourceName(roleType, Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT),
      };

      let promise = iam.createRole(roleParams)
        .promise()
        .then(data => {
          roles[roleType] = data.Role;
        })
        .catch(error => {
          setImmediate(() => {
            throw new FailedToCreateIamRoleException(roleParams.RoleName, error);
          });
        });

      promiseStack.push(promise);
    }

    return Promise.all(promiseStack).then(() => {
      let cognitoIdentity = this.provisioning.cognitoIdentity;

      let parameters = {
        IdentityPoolId: identityPool.IdentityPoolId,
        Roles: {
          authenticated: roles[CognitoIdentityService.ROLE_AUTH].Arn,
          unauthenticated: roles[CognitoIdentityService.ROLE_UNAUTH].Arn,
        },
      };

      return cognitoIdentity.setIdentityPoolRoles(parameters)
        .promise()
        .then(() => roles)
        .catch(error => {
          setImmediate(() => {
            throw new FailedSettingIdentityPoolRolesException(identityPool.IdentityPoolName, error);
          });
        });
    });
  }

  /**
   * IAM role that is assumed by created Cognito identity pool
   *
   * @param {Object} identityPool
   * @param {String} roleType
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
   * @returns {Promise}
   * @private
   */
  _updateCognitoRolesPolicy(cognitoRoles) {
    let iam = this.provisioning.iam;
    let policies = {};
    let promiseStack = [];

    for (let cognitoRoleType in cognitoRoles) {
      if (!cognitoRoles.hasOwnProperty(cognitoRoleType)) {
        continue;
      }

      let cognitoRole = cognitoRoles[cognitoRoleType];
      let policy;

      switch (cognitoRoleType) {
        case CognitoIdentityService.ROLE_AUTH:
          policy = this.policyProvider.getAuthenticatedPolicy();
          break;
        case CognitoIdentityService.ROLE_UNAUTH:
          policy = this.policyProvider.getUnauthenticatedPolicy();
          break;
        default:
          throw new MissingPolicyProviderMethodException(cognitoRoleType);
      }

      let authPolicyPayload = {
        PolicyDocument: policy.toString(),
        PolicyName: this.generateAwsResourceName(cognitoRoleType, Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT),
        RoleName: cognitoRole.RoleName,
      };

      [authPolicyPayload, this._createSystemPolicyPayload(cognitoRole)].forEach(params => {
        let promise = iam.putRolePolicy(params)
          .promise()
          .then(() => {
            policies[params.RoleName] = policy;
          })
          .catch(error => {
            setImmediate(() => {
              throw new FailedAttachingPolicyToRoleException(params.PolicyName, params.RoleName, error);
            });
          });

        promiseStack.push(promise);
      });
    }

    return Promise.all(promiseStack).then(() => policies);
  }

  /**
   * Method is also used in deep-account::account-lib::iam::roleManager
   * @param {Object} role
   * @returns {Object}
   * @private
   */
  _createSystemPolicyPayload(role) {
    let policy = new Core.AWS.IAM.Policy();
    let apiGateway = this.provisioning.services.find(APIGatewayService);
    let sqsService = this.provisioning.services.find(SQSService);
    let cognitoIdentity = this.provisioning.services.find(CognitoIdentityService);

    // allow users calling all api gateways 
    // if account microservice not included
    if (!this.property.accountMicroservice) {
      policy.statement.add(APIGatewayService.generateAllowInvokeMethodStatement(apiGateway.getAllEndpointsArn()));
    }
    
    policy.statement.add(sqsService.generateAllowActionsStatement());
    policy.statement.add(cognitoIdentity.generateAllowCognitoSyncStatement(
      ['ListRecords', 'UpdateRecords', 'ListDatasets']
    ));

    this.property
      .microservices
      .forEach(ms => ms.overwriteRolePolicy('system', policy));

    return {
      PolicyDocument: policy.toString(),
      PolicyName: this.generateAwsResourceName(
        'SystemPolicy',
        Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT
      ),
      RoleName: role.RoleName,
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
  generateAllowCognitoSyncStatement(
    allowedActions = [Core.AWS.IAM.Policy.ANY], targetService = CognitoIdentityService
  ) {
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
   * @returns {{identityProviders: (string|*|{})}}
   */
  get securityConfig() {
    let globalsConfig = this.property.config.globals;
    let securityConfig = globalsConfig.security || {};
    let identityProviders = securityConfig.identityProviders || {};

    return {
      identityProviders,
    };
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
      condition.StringEquals['cognito-identity.amazonaws.com:sub'] = ['${cognito-identity.amazonaws.com:sub}'];
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
