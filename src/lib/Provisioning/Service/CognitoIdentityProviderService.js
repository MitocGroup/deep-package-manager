/**
 * Created by CCristi on 6/27/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {CognitoIdentityService} from './CognitoIdentityService';
import {FailedToCreateCognitoUserPoolException} from './Exception/FailedToCreateCognitoUserPoolException';
import {FailedToUpdateIdentityPoolException} from './Exception/FailedToUpdateIdentityPoolException';
import Core from 'deep-core';

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
    let userPoolMetadata = this.userPoolMetadata;
    let oldPool = this._config.UserPool;

    if (userPoolMetadata.enabled && !oldPool) {
      this._createUserPool(userPool => {
        this._config.UserPool = userPool;

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
    let cognitoIdentity = services.find(CognitoIdentityService);
    let cognitoConfig = cognitoIdentity.config();
    let identityPool = cognitoConfig.identityPool;

    if (this._isUpdate && identityPool.CognitoIdentityProviders) {
      this._ready = true;

      return this;
    }

    this._linkUserPoolWithIdentityPool(identityPool, updatedIdentity => {
      cognitoConfig.identityPool = updatedIdentity;

      this._ready = true;
    });

    return this;
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
   * @param {Object} identityPool
   * @param {Function} cb
   * @private
   */
  _linkUserPoolWithIdentityPool(identityPool, cb) {
    let userPool = this._config.UserPool;
    let userPoolClient = this._config.UserPoolClient;
    let cognitoIdentity = this.provisioning.cognitoIdentity;

    identityPool.CognitoIdentityProviders = [
      {
        ClientId: userPoolClient.ClientId,
        ProviderName: this._generateCognitoProviderName(userPool),
      },
    ];

    cognitoIdentity.updateIdentityPool(identityPool, (error, updatedIdentity) => {
      if (error) {
        throw new FailedToUpdateIdentityPoolException(identityPool.IdentityPoolName, error);
      }

      cb(updatedIdentity);
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
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY,
    ];
  }
}
