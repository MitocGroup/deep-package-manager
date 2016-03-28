/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class IAMDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Overrides base _matchResource by adding support for oidc provider IAM resources
   * e.g. arn:aws:iam::545786123497:oidc-provider/example.auth0.com
   *
   * @param {String} resource
   * @returns {Boolean}
   * @private
   */
  _matchResource(resource) {
    if (this._isOIDCProvider(resource)) {
      let oidcProviderARN = null;

      if (this._deployCfg && this._deployCfg.iam.identityProvider) {
        oidcProviderARN = this._deployCfg.iam.identityProvider.OpenIDConnectProviderArn;
      }

      return oidcProviderARN ? resource === oidcProviderARN : false;
    }

    if (typeof this._baseHash === 'function') {
      return this._baseHash.bind(this)(resource);
    } else if (this._baseHash instanceof RegExp) {
      return this._baseHash.test(resource);
    }

    return AbstractService.extractBaseHashFromResourceName(resource) === this._baseHash;
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    let methods = ['_listRoles', '_listOIDCProviders'];
    let responseCount = 0;
    let errors = [];

    methods.forEach((methodName) => {
      this[methodName]((error) => {
        responseCount++;

        if (error) {
          errors.push(error);
        }

        if (responseCount === methods.length) {
          cb(errors.length > 0 ? errors.join('; ') : null);
        }
      });
    });
  }

  /**
   * @param {Function} cb
   * @private
   */
  _listRoles(cb) {
    this._awsService.listRoles({
      MaxItems: IAMDriver.MAX_ITEMS,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.Roles) {
        if (!data.Roles.hasOwnProperty(i)) {
          continue;
        }

        let roleData = data.Roles[i];
        let roleName = roleData.RoleName;

        this._checkPushStack(roleName, roleName, roleData);
      }

      cb(null);
    });
  }

  /**
   * @param {Function} cb
   * @private
   */
  _listOIDCProviders(cb) {
    this._awsService.listOpenIDConnectProviders({}, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      data.OpenIDConnectProviderList.forEach((provider) => {
        let providerARN = provider.Arn;

        this._checkPushStack(providerARN, providerARN, providerARN);
      });

      cb(null);
    });
  }

  /**
   * @param {String} resource
   * @returns {Boolean}
   * @private
   */
  _isOIDCProvider(resource) {
    return /^arn:aws:iam:.*:.*:oidc-provider\/.+$/.test(resource);
  }

  /**
   * @returns {Number}
   */
  static get MAX_ITEMS() {
    return 1000;
  }
}
