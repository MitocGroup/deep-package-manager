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
      this._createUserPool(userPool => {
        this._config.UserPool = userPool;
        this._config.ProviderName = this._generateCognitoProviderName(userPool);

        this._createUserPoolClient(userPool, userPoolClient => {
          this._config.UserPoolClient = userPoolClient;

          this._ready = true;
        });
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
  _postDeployProvision(services) {
    if (this._isUpdate || !this.isCognitoPoolEnabled) {
      this._ready = true;
      return this;
    }

    this._createAdminUser()

    return this;
  }

  /**
   * @param {Function} cb
   * @private
   */
  _createAdminUser(cb) {
    let payload = {
      ClientId: this._config.UserPoolClient.Id,
      Password: this._generatePseudoRandomPassword(),
      Username: CognitoIdentityProviderService.ADMIN_USERNAME,
    };

    cognitoIdentityServiceProvider.signUp(payload, (error, response) => {
      if (error) {
        throw new Error(`Error while generating admin user: ${error}`);
      }

      cb(response.user);
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
   * @param {Function} cb
   * @private
   */
  _createUserPool(cb) {
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let userPoolMetadata = this.userPoolMetadata;
    let payload = {
      PoolName: userPoolMetadata.poolName,
      PasswordPolicy: userPoolMetadata.passwordPolicy,
    };

    cognitoIdentityServiceProvider.createUserPool(payload, (error, data) => {
      if (error) {
        throw new FailedToCreateCognitoUserPoolException(userPoolMetadata.poolName, error);
      }

      cb(data.UserPool);
    });
  }

  /**
   * @param {Object} userPool
   * @param {Function} cb
   * @private
   */
  _createUserPoolClient(userPool, cb) {
    let userPoolMetadata = this.userPoolMetadata;
    let cognitoIdentityServiceProvider = this.provisioning.cognitoIdentityServiceProvider;
    let payload = {
      UserPoolId: userPool.Id,
      // JavaScript SDK doesn't support apps that have a client secret, 
      // http://docs.aws.amazon.com/cognito/latest/developerguide/setting-up-the-javascript-sdk.html
      GenerateSecret: false,
      ClientName: userPoolMetadata.clientName,
    };

    cognitoIdentityServiceProvider.createUserPoolClient(payload, (error, data) => {
      if (error) {
        throw new FailedToCreateCognitoUserPoolException(userPoolMetadata.poolName, error);
      }

      cb(data.UserPoolClient);
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
