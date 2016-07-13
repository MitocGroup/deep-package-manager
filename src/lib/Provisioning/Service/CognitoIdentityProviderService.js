/**
 * Created by CCristi on 6/27/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {FailedToCreateCognitoUserPoolException} from './Exception/FailedToCreateCognitoUserPoolException';
import Core from 'deep-core';
import PwGen from 'pwgen/lib/pwgen_module';

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
    let oldPool = this._config.UserPool;

    if (this.isCognitoPoolEnabled && !oldPool) {
      this
        ._createUserPool()
        .then(userPool => {
          this._config.UserPool = userPool;
          this._config.ProviderName = this._generateCognitoProviderName(userPool);

          return this._createUserPoolClient(userPool);
        })
        .then(userPoolClient => {
          this._config.UserPoolClient = userPoolClient;

          return this._createAdminUser();
        })
        .then(() => {
          this._ready = true;
        });

      return this;
    }

    this._ready = true;

    return this;
  }

  /**
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
   * @params {Object} services
   * @returns {CognitoIdentityProviderService}
   */
  _postDeployProvision(/* services */) {
    if (this._isUpdate || !this.isCognitoPoolEnabled) {
      this._ready = true;
      return this;
    }

    this._createAdminUser();

    return this;
  }

  /**
   * @returns {Promise}
   * @private
   */
  _createAdminUser() {
    let clientId = this._config.UserPoolClient.ClientId;
    let userPoolId = this._config.UserPool.Id;
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let userPayload = {
      ClientId: clientId,
      Password: this._generatePseudoRandomPassword(),
      Username: CognitoIdentityProviderService.ADMIN_USERNAME,
    };

    return cognitoIdentityServiceProvider
      .signUp(userPayload)
      .promise()
      .then(() => {
        let confirmPayload = {
          UserPoolId: userPoolId,
          Username: userPayload.Username,
        };

        return cognitoIdentityServiceProvider
          .adminConfirmSignUp(confirmPayload)
          .promise();
      })
      .catch(e => {
        // @todo: Sorry guys :/, Promise suppresses any kind of synchronous errors.
        setImmediate(() => {
          throw new Error(`Error while generating admin user: ${e}`);
        });
      });
  }

  /**
   * @returns {String}
   * @private
   */
  _generatePseudoRandomPassword() {
    let pwGen = new PwGen();

    pwGen.includeCapitalLetter = true;
    pwGen.includeNumber = true;

    return pwGen.generate();
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
  _createUserPoolClient(userPool) {
    let userPoolMetadata = this.userPoolMetadata;
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let payload = {
      UserPoolId: userPool.Id,
      // JavaScript SDK doesn't support apps that have a client secret, 
      // http://docs.aws.amazon.com/cognito/latest/developerguide/setting-up-the-javascript-sdk.html
      GenerateSecret: false,
      ClientName: userPoolMetadata.clientName,
    };

    return cognitoIdentityServiceProvider
      .createUserPoolClient(payload)
      .promise()
      .then(data => data.UserPoolClient)
      .catch(e => {
        setImmediate(() => {
          throw new FailedToCreateCognitoUserPoolException(userPoolMetadata.poolName, e);
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

      this._userPoolMetadata = {
        enabled: globalConfig.userPool && globalConfig.userPool.enabled,
        clientName: this.generateAwsResourceName(
          CognitoIdentityProviderService.USER_POOL_CLIENT_NAME,
          this.name()
        ),
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
  static get USER_POOL_NAME() {
    return 'UserPool';
  }

  /**
   * @returns {String}
   */
  static get USER_POOL_CLIENT_NAME() {
    return 'UserPoolClient';
  }

  /**
   * @todo: move into config
   * @returns {String}
   */
  static get ADMIN_USERNAME() {
    return 'admin';
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
    ];
  }
}
