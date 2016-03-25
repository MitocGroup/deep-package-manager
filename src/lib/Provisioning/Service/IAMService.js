/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {Exception} from '../../Exception/Exception';
import {FailedToCreateOIDCException} from './Exception/FailedToCreateOIDCException';

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
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

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
   * @param {Object} IdPConfig
   * @param {Function} callback
   * @private
   */
  _createOpenIDConnectProvider(IdPConfig, callback) {
    let iam = this.provisioning.iam;

    let params = {
      ThumbprintList: [
        IdPConfig.ThumbPrint,
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
