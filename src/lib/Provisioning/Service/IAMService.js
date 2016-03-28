/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {Exception} from '../../Exception/Exception';
import {FailedToCreateOIDCException} from './Exception/FailedToCreateOIDCException';
import {FailedToDeleteOIDCException} from './Exception/FailedToDeleteOIDCException';

/**
 * IAM service
 */
export class IAMService extends AbstractService {
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
    return Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {IAMService}
   */
  _setup(services) {
    let auth0Config = this.getAuth0Config();

    if (this._isUpdate) {
      let oldIdentityProvider = this._config.identityProvider;

      if (oldIdentityProvider && !auth0Config) {
        this._deleteOpenIDConnectProvider(oldIdentityProvider.OpenIDConnectProviderArn, (response) => {
          this._config.identityProvider = null;
          this._ready = true;
        });
      } else {
        this._ready = true;
      }

      return this;
    }

    if (auth0Config) {
      this._createOpenIDConnectProvider(auth0Config, (response) => {
        this._config.identityProvider = response;
        this._ready = true;
      });
    } else {
      this._ready = true;
    }

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {IAMService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {IAMService}
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
   * @returns {{domain: string, clientID: string}}
   */
  getAuth0Config() {
    // @todo - replace temp Auth0 config with one from global property config
    return null;
  }

  /**
   * @param {Object} IdPConfig
   * @param {Function} callback
   * @private
   */
  _createOpenIDConnectProvider(IdPConfig, callback) {
    let iam = this.provisioning.iam;

    let params = {
      ThumbprintList: [
        IdPConfig.thumbprint,
      ],
      Url: IdPConfig.domain,
      ClientIDList: [
        IdPConfig.clientID,
      ],
    };

    iam.createOpenIDConnectProvider(params, (error, data) => {
      if (error) {
        throw new FailedToCreateOIDCException(params, error);
      } else {
        callback(data);
      }
    });
  }

  /**
   * @param {String} identityProviderARN
   * @param {Function} callback
   * @private
   */
  _deleteOpenIDConnectProvider(identityProviderARN, callback) {
    let iam = this.provisioning.iam;

    let params = {
      OpenIDConnectProviderArn: identityProviderARN,
    };

    iam.deleteOpenIDConnectProvider(params, (error, data) => {
      if (error) {
        throw new FailedToDeleteOIDCException(identityProviderARN, error);
      } else {
        callback(data);
      }
    });
  }

  /**
   * Creates IAM role assume policy for passed aws service
   *
   * @param {*} serviceIdentifiers
   * @returns {Core.AWS.IAM.Policy}
   */
  static getAssumeRolePolicy(...serviceIdentifiers) {
    let rolePolicy = new Core.AWS.IAM.Policy();

    serviceIdentifiers.forEach((serviceIdentifier) => {
      if (!Core.AWS.Service.exists(serviceIdentifier)) {
        throw new Exception(`Unknown service identifier "${serviceIdentifier}".`);
      }

      let statement = rolePolicy.statement.add();
      statement.principal = {
        Service: Core.AWS.Service.identifier(serviceIdentifier),
      };

      let action = statement.action.add();
      action.service = Core.AWS.Service.SECURITY_TOKEN_SERVICE;
      action.action = 'AssumeRole';
    });

    return rolePolicy;
  }
}
