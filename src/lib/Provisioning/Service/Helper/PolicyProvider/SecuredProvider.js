/**
 * Created by CCristi on 7/7/16.
 */

'use strict';

import {PolicyTranslator} from '../../../../Helpers/PolicyTranslator';
import {CognitoIdentityService} from '../../CognitoIdentityService';
import {AbstractProvider} from './AbstractProvider';
import {MissingAccountMicroserviceException} from '../../Exception/MissingAccountMicroserviceException';
import Core from 'deep-core';
import path from 'path';
import fs from 'fs';

export class SecuredProvider extends AbstractProvider {
  /**
   * @param {Provisioning/Instance} provisioning
   */
  constructor(provisioning) {
    if (!provisioning.property.accountMicroservice) {
      throw new MissingAccountMicroserviceException();
    }

    super(provisioning);

    this._translator = new PolicyTranslator(provisioning.property);
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   */
  _getAuthenticatedPolicy() {
    let authDefinition = this._rolePath(CognitoIdentityService.ROLE_AUTH);

    if (fs.existsSync(authDefinition)) {
      return this._translator.toIAMPolicy(
        require(authDefinition)
      );
    }

    return this._generateDefaultPolicy();
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   */
  _getUnauthenticatedPolicy() {
    let unAuthDefinition = this._rolePath(CognitoIdentityService.ROLE_UNAUTH);

    if (fs.existsSync(unAuthDefinition)) {
      return this._translator.toIAMPolicy(
        require(unAuthDefinition)
      );
    }

    return this._generateDefaultPolicy();
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   * @private
   */
  _generateDefaultPolicy() {
    let policy = new Core.AWS.IAM.Policy();

    let denyStmt = this.lambdaService.generateDenyInvokeFunctionStatement(() => true);
    policy.statement.add(denyStmt);

    return policy;
  }

  /**
   * @param {String} roleName
   * @returns {String}
   * @private
   */
  _rolePath(roleName) {
    return path.join(this.accountMicroservice.autoload.roles, `${roleName}.json`);
  }

  /**
   * @returns {Microservice|Instance}
   */
  get accountMicroservice() {
    return this.provisioning.property.accountMicroservice;
  }
}
