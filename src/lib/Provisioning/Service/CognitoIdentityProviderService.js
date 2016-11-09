/**
 * Created by CCristi on 6/27/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {LambdaService} from './LambdaService';
import {FailedToCreateCognitoUserPoolException} from './Exception/FailedToCreateCognitoUserPoolException';
import {FailedToUpdateUserPoolException} from './Exception/FailedToUpdateUserPoolException';
import {FailedToCreateAdminUserException} from './Exception/FailedToCreateAdminUserException';
import {CognitoIdentityService} from './CognitoIdentityService';
import Core from 'deep-core';
import passwordGenerator from 'password-generator';
import AWS from 'aws-sdk';

global.AWS = AWS; // amazon cognito js need AWS object to be set globally
require('amazon-cognito-js');

export class CognitoIdentityProviderService extends AbstractService {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._userPoolMetadata = null;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.COGNITO_IDENTITY_PROVIDER;
  }

  /**
   * @returns {CognitoIdentityProviderService}
   * @private
   */
  _setup() {
    let oldPool = this._config.userPool;

    if (this.isCognitoPoolEnabled && !oldPool) {
      this
        ._createUserPool()
        .then(userPool => {
          this._config.userPool = userPool;
          this._config.providerName = this._generateCognitoProviderName(userPool);

          return this._createUserPoolClients(userPool);
        })
        .then(userPoolClients => {
          this._config.userPoolClients = userPoolClients;

          this._ready = true;
        });

      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @returns {CognitoIdentityProviderService}
   * @private
   */
  _postProvision() {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @returns {CognitoIdentityProviderService}
   * @private
   */
  _postDeployProvision(/* services */) {
    if (!this.isCognitoPoolEnabled) {
      this._ready = true;
      return this;
    }

    this
      ._registerUserPoolTriggers()
      .then(() => this._config.adminUser || this._createAdminUser())
      .then(adminUser => {
        this._config.adminUser = adminUser;

        this._ready = true;
      });

    return this;
  }

  /**
   * @returns {Promise}
   * @private
   */
  _createAdminUser() {
    let globals = this.property.config.globals;
    let adminMetadata = (globals.security || {}).admin;

    if (!adminMetadata) {
      return Promise.resolve(null);
    }

    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let systemClientApp = this._config.userPoolClients[CognitoIdentityProviderService.SYSTEM_CLIENT_APP];

    let adminUserPayload = {
      ClientId: systemClientApp.ClientId,
      Password: this._generatePseudoRandomPassword(),
      Username: adminMetadata.username,
      UserAttributes: [
        {
          Name: 'email',
          Value: adminMetadata.email,
        },
      ],
    };

    return cognitoIdentityServiceProvider
      .signUp(adminUserPayload)
      .promise()
      .then(() => {
        let payload = {
          UserPoolId: this._config.userPool.Id,
          Username: adminUserPayload.Username,
        };

        return cognitoIdentityServiceProvider
          .adminGetUser(payload)
          .promise()
          .then(response => {
            return response.UserStatus === CognitoIdentityProviderService.CONFIRMED_STATUS ?
              Promise.resolve(null) :
              cognitoIdentityServiceProvider.adminConfirmSignUp(payload).promise();
          });
      })
      .then(() => this._authenticateAdminUser(adminUserPayload))
      .then(identityId => {
        adminUserPayload.identityId = identityId;

        return adminUserPayload;
      })
      .catch(e => {
        // @todo: Sorry guys :/, Promise suppresses any kind of synchronous errors.
        setImmediate(() => {
          throw new FailedToCreateAdminUserException(e);
        });
      });
  }

  /**
   * @param {Object} adminUser
   * @returns {Promise}
   * @private
   */
  _authenticateAdminUser(adminUser) {
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let systemClientApp = this._config.userPoolClients[CognitoIdentityProviderService.SYSTEM_CLIENT_APP];
    let userPool = this._config.userPool;

    let authPayload = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: userPool.Id,
      ClientId: systemClientApp.ClientId,
      AuthParameters: {
        USERNAME: adminUser.Username,
        PASSWORD: adminUser.Password,
      },
    };

    return cognitoIdentityServiceProvider
      .adminInitiateAuth(authPayload)
      .promise()
      .then(authResponse => {
        let cognitoConfig = this.provisioning.services.find(CognitoIdentityService).config();
        let cognitoParams = {
          IdentityPoolId: cognitoConfig.identityPool.IdentityPoolId,
          Logins: {},
        };

        cognitoParams.Logins[this._config.providerName] = authResponse.AuthenticationResult.IdToken;

        let credentials = new AWS.CognitoIdentityCredentials(cognitoParams);

        return new Promise(
          (resolve, reject) => {
            credentials.refresh(error => {
              if (error) {
                return reject(error);
              }

              resolve(credentials.identityId);
            });
          }
        );
      });
  }

  /**
   * @returns {Promise}
   * @private
   */
  _createUserPool() {
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let userPoolMetadata = this.userPoolMetadata;
    let payload = {
      PoolName: userPoolMetadata.poolName,
      Policies: {
        PasswordPolicy: userPoolMetadata.passwordPolicy,
      },
    };

    let emailVerifications = userPoolMetadata.verifications.email;

    if (emailVerifications && emailVerifications.enabled) {
      payload.AutoVerifiedAttributes = ['email'];
    }

    return cognitoIdentityServiceProvider
      .createUserPool(payload)
      .promise()
      .then(data => data.UserPool)
      .catch(e => {
        setImmediate(() => {
          throw new FailedToCreateCognitoUserPoolException(userPoolMetadata.poolName, e);
        });
      });
  }

  /**
   * @param {Object} userPool
   * @returns {Promise}
   * @private
   */
  _createUserPoolClients(userPool) {
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let promises = [];

    this.userPoolMetadata.clients.forEach(clientName => {
      let payload = {
        UserPoolId: userPool.Id,
        // JavaScript SDK doesn't support apps that have a client secret,
        // http://docs.aws.amazon.com/cognito/latest/developerguide/setting-up-the-javascript-sdk.html
        GenerateSecret: false,
        ClientName: clientName,
        ExplicitAuthFlows: [
          'ADMIN_NO_SRP_AUTH',
        ],
      };

      promises.push(cognitoIdentityServiceProvider.createUserPoolClient(payload).promise());
    });

    return Promise.all(promises)
      .then(responses => {
        let clientsMap = {};

        responses.forEach(response => {
          let client = response.UserPoolClient;
          clientsMap[client.ClientName] = client;
        });

        return clientsMap;
      })
      .catch(e => {
        setImmediate(() => {
          throw new FailedToCreateCognitoUserPoolException(this.userPoolMetadata.poolName, e);
        });
      });
  }

  /**
   * @todo: add user schema specific attributes
   * @returns {{enabled: Boolean, name: String}}
   */
  get userPoolMetadata() {
    if (this._userPoolMetadata === null) {
      let globalConfig = this.property.config.globals;
      let poolConfig = globalConfig.security && globalConfig.security.userPool ?
        globalConfig.security.userPool :
        {};

      // @todo - remove fallback to globalConfig.userPool && globalConfig.userPool.enabled
      // when "enabled" parameter will be consolidated into deep-account under security key
      let enabled = poolConfig.enabled || globalConfig.userPool && globalConfig.userPool.enabled;
      let clients = (poolConfig.clients || '').trim();
      clients = clients ? clients.split(/[\s,]+/) : [];

      if (clients.indexOf(CognitoIdentityProviderService.SYSTEM_CLIENT_APP) === -1) {
        clients.push(CognitoIdentityProviderService.SYSTEM_CLIENT_APP);
      }

      this._userPoolMetadata = {
        enabled: enabled,
        clients: clients,
        verifications: poolConfig.verifications,
        poolName: this.generateAwsResourceName(
          CognitoIdentityProviderService.USER_POOL_NAME,
          this.name()
        ),
        passwordPolicy: CognitoIdentityProviderService.DEFAULT_PASSWORD_POLICY,
      };
    }

    return this._userPoolMetadata;
  }

  /**
   * @private
   * @returns {Promise}
   */
  _registerUserPoolTriggers() {
    let userPool = this._config.userPool;
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let triggers = this._extractUserPoolTriggers();

    if (Object.keys(triggers).length === 0) {
      return Promise.resolve(userPool);
    }

    let payload = {
      UserPoolId: userPool.Id,
      LambdaConfig: triggers,
    };

    return cognitoIdentityServiceProvider
      .updateUserPool(payload)
      .promise()
      .then(() => {
        userPool.LambdaConfig = triggers;

        return userPool;
      })
      .then(() => { //@todo: move permissions provision into LambdaService?
        let lambda = this.provisioning.lambda;
        let userPoolId = this._config.userPool.Id;
        let cognitoIdpArn = this._generateCognitoIdpArn();
        let promises = Object.keys(triggers).map(triggerName => {
          let lambdaArn = triggers[triggerName];
          let payload =  {
            Action: 'lambda:InvokeFunction',
            Principal: Core.AWS.Service.identifier(this.name()),
            FunctionName: lambdaArn,
            StatementId: `${triggerName}_${userPoolId}`,
            SourceArn: cognitoIdpArn,
          };

          return lambda.addPermission(payload).promise();
        });

        return Promise.all(promises);
      })
      .catch(e => {
        if (e.code === 'ResourceConflictException') {
          return Promise.resolve(userPool);
        }

        setImmediate(() => {
          throw new FailedToUpdateUserPoolException(userPool.Name, e);
        });
      });
  }

  /**
   * @see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#createUserPool-property, LambdaConfig
   * @returns {Object}
   * @private
   */
  _extractUserPoolTriggers() {
    let globalConfig = this.property.config.globals;
    let lambdaService = this.provisioning.services.find(LambdaService);
    let triggers = ((globalConfig.security || {}).userPool || {}).triggers || {};
    let normalizedTriggers = {};

    for (let triggerName in triggers) {
      if (!triggers.hasOwnProperty(triggerName)) {
        continue;
      }

      let deepResourceName = triggers[triggerName];
      let lambdaArn = lambdaService.resolveDeepResourceName(deepResourceName);

      if (lambdaArn) {
        normalizedTriggers[triggerName] = lambdaArn;
      } else {
        //@todo: Throw error here?
        console.warn(
          `Unknown deep resource name: "${deepResourceName}". ` +
          `Skipping setting cognito user pool "${triggerName}" trigger...`
        );
      }
    }

    return normalizedTriggers;
  }

  /**
   * @param {String[]} actions
   * @returns {Object}
   */
  generateAllowActionsStatement(actions) {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    actions.forEach((actionName) => {
      statement.action.add(Core.AWS.Service.COGNITO_IDENTITY_PROVIDER, actionName);
    });

    statement.resource.add(
      Core.AWS.Service.COGNITO_IDENTITY_PROVIDER,
      this.provisioning.cognitoIdentityServiceProvider.config.region,
      this.awsAccountId,
      `userpool/${this._config.userPool.Id}`
    );

    return statement;
  }

  /**
   * @returns {String}
   * @private
   */
  _generateCognitoIdpArn() {
    let userPool = this._config.userPool;
    let region = this.provisioning.cognitoIdentityServiceProvider.config.region;

    return `arn:aws:${this.name()}:${region}:${this.awsAccountId}:userpool/${userPool.Id}`;
  }

  /**
   * @returns {String}
   * @private
   */
  _generatePseudoRandomPassword() {
    const policy = CognitoIdentityProviderService.DEFAULT_PASSWORD_POLICY;

    let minLength = policy.MinimumLength;
    let maxLength = minLength + 8;
    let uppercaseMinCount = 2;
    let lowercaseMinCount = 2;
    let numberMinCount = 2;
    let specialMinCount = 2;
    let UPPERCASE_RE = /([A-Z])/g;
    let LOWERCASE_RE = /([a-z])/g;
    let NUMBER_RE = /([\d])/g;
    let SPECIAL_CHAR_RE = /([\?\-])/g;

    let isStrongEnough = (password) => {
      let uc = password.match(UPPERCASE_RE);
      let lc = password.match(LOWERCASE_RE);
      let n = password.match(NUMBER_RE);
      let sc = password.match(SPECIAL_CHAR_RE);

      if (password.length < minLength) {
        return false;
      }

      if (policy.RequireUppercase && !uc || (uc && uc.length < uppercaseMinCount)) {
        return false;
      }

      if (policy.RequireLowercase && !lc || (lc && lc.length < lowercaseMinCount)) {
        return false;
      }

      if (policy.RequireNumbers && !n || (n && n.length < numberMinCount)) {
        return false;
      }

      if (policy.RequireSymbols && !sc || (sc && sc.length < specialMinCount)) {
        return false;
      }

      return true;
    };

    let customPassword = () => {
      let password = '';
      let randomLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength;

      while (!isStrongEnough(password)) {
        password = passwordGenerator(randomLength, false, /[\w\d\?\-]/);
      }

      return password;
    };

    return customPassword();
  }

  /**
   * @param {Object} userPool
   * @returns {String}
   * @private
   */
  _generateCognitoProviderName(userPool) {
    let region = this.provisioning.cognitoIdentityServiceProvider.config.region;

    return `${this.name()}.${region}.amazonaws.com/${userPool.Id}`;
  }

  /**
   * @returns {Boolean}
   */
  get isCognitoPoolEnabled() {
    return this.userPoolMetadata.enabled;
  }

  /**
   * @returns {String}
   */
  static get CONFIRMED_STATUS() {
    return 'CONFIRMED';
  }

  /**
   * @returns {String}
   */
  static get USER_POOL_NAME() {
    return 'UserPool';
  }

  /**
   * @returns {String}
   */
  static get SYSTEM_CLIENT_APP() {
    return 'system';
  }

  /**
   * @returns {{MinimumLength: Number, RequireUppercase: Boolean, RequireLowercase: Boolean, RequireNumbers: Boolean, RequireSymbols: Boolean}}
   */
  static get DEFAULT_PASSWORD_POLICY() {
    return {
      MinimumLength: 8,
      RequireUppercase: true,
      RequireLowercase: true,
      RequireNumbers: true,
      RequireSymbols: false,
    }
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.US_EAST_N_VIRGINIA,
      Core.AWS.Region.EU_IRELAND,
      Core.AWS.Region.ASIA_PACIFIC_TOKYO,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }
}
