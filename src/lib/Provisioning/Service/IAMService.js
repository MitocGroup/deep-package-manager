/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {Exception} from '../../Exception/Exception';
import {FailedToCreateOIDCException} from './Exception/FailedToCreateOIDCException';
import {FailedToDeleteOIDCException} from './Exception/FailedToDeleteOIDCException';
import {FailedToGetOIDCProviderException} from './Exception/FailedToGetOIDCProviderException';
import {FailedToAddClientIdToOIDCProviderException} from './Exception/FailedToAddClientIdToOIDCProviderException';
import url from 'url';

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
    let auth0Config = this.property.config.globals.auth0 || {};
    let auth0Thumbprint = auth0Config.init && auth0Config.init.thumbprint ? auth0Config.init.thumbprint : null;

    if (this._isUpdate) {
      let oldIdentityProvider = this._config.identityProvider;

      if (oldIdentityProvider && !auth0Thumbprint) {
        this._deleteOpenIDConnectProvider(oldIdentityProvider.OpenIDConnectProviderArn, (response) => {
          this._config.identityProvider = null;
          this._ready = true;
        });
      } else {
        this._ready = true;
      }

      return this;
    }

    var provisionDoneCb = (response) => {
      if (response) {
        response.domain = auth0Config.init.domain;
        response.clientID = auth0Config.init.clientID;
      }

      this._config.identityProvider = response;
      this._ready = true;
    };

    if (auth0Thumbprint) {
      let oidcProviderArn = this._generateOIDCProviderArn(auth0Config.init.domain);

      this._checkOpenIDConnectProviderExists(oidcProviderArn, (response) => {

        if (response && response.ClientIDList) {

          if (response.ClientIDList.indexOf(auth0Config.init.clientID) === -1) {

            this._addClientIDToOpenIDConnectProvider(auth0Config.init.clientID, oidcProviderArn, () => {

              response.ClientIDList.push(auth0Config.init.clientID);
              provisionDoneCb(response);
            });
          } else {
            provisionDoneCb(response);
          }
        } else {
          this._createOpenIDConnectProvider(auth0Config.init, provisionDoneCb);
        }
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
   * @param {Object} oidcProviderArn
   * @param {Function} callback
   * @private
   */
  _checkOpenIDConnectProviderExists(oidcProviderArn, callback) {
    let iam = this.provisioning.iam;

    let params = {
      OpenIDConnectProviderArn: oidcProviderArn,
    };

    iam.getOpenIDConnectProvider(params, (error, data) => {
      if (error) {
        throw new FailedToGetOIDCProviderException(oidcProviderArn, error);
      } else {
        callback(data);
      }
    });
  }

  /**
   * @param {String} clientId
   * @param {String} oidcProviderArn
   * @param {Function} callback
   * @private
   */
  _addClientIDToOpenIDConnectProvider(clientId, oidcProviderArn, callback) {
    let iam = this.provisioning.iam;

    let params = {
      ClientID: clientId,
      OpenIDConnectProviderArn: oidcProviderArn,
    };

    iam.addClientIDToOpenIDConnectProvider(params, (error, data) => {
      if (error) {
        throw new FailedToAddClientIdToOIDCProviderException(
          params.ClientID, params.OpenIDConnectProviderArn, error
        );
      } else {
        callback(data);
      }
    });
  }

  /**
   * @param {Object} IdPConfig
   * @param {Function} callback
   * @private
   */
  _createOpenIDConnectProvider(IdPConfig, callback) {
    let iam = this.provisioning.iam;

    // make sure provider protocol is https
    // @see http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/IAM.html#createOpenIDConnectProvider-property
    let urlParts = url.parse(IdPConfig.domain);
    urlParts.protocol = 'https';
    let oidcProvderUrl = url.format(urlParts);

    let params = {
      ThumbprintList: [
        IdPConfig.thumbprint,
      ],
      Url: oidcProvderUrl,
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
   * @param {String} providerDomain
   * @returns {String}
   */
  _generateOIDCProviderArn(providerDomain) {
    return `arn:aws:iam::${this.awsAccountId}:oidc-provider/${providerDomain}`;
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
