/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import {Exception} from '../../Exception/Exception';

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
    this._ready = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {IAMService}
   */
  _postProvision(services) {
    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {IAMService}
   */
  _postDeployProvision(services) {
    this._ready = true;

    return this;
  }

  /**
   * Creates IAM role assume policy for passed aws service
   *
   * @returns {Core.AWS.IAM.Policy}
   */
  static getAssumeRolePolicy(serviceIdentifier) {
    if (!Core.AWS.Service.exists(serviceIdentifier)) {
      throw new Exception(`Unknown service identifier "${serviceIdentifier}".`);
    }

    let rolePolicy = new Core.AWS.IAM.Policy();

    let statement = rolePolicy.statement.add();
    statement.principal = {
      Service: Core.AWS.Service.identifier(serviceIdentifier),
    };

    let action = statement.action.add();
    action.service = Core.AWS.Service.SECURITY_TOKEN_SERVICE;
    action.action = 'AssumeRole';

    return rolePolicy;
  }
}
