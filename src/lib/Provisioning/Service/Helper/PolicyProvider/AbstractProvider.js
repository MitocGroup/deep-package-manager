/**
 * Created by CCristi on 7/7/16.
 */

'use strict';

import Core from 'deep-core';
import {LambdaService} from '../../LambdaService';

export class AbstractProvider extends Core.OOP.Interface {
  /**
   * @param {Provisioning/Instance} provisioning
   */
  constructor(provisioning) {
    super([
      '_getAuthenticatedPolicy', 
      '_getUnauthenticatedPolicy',
    ]);

    this._provisioning = provisioning;
  }

  /**
   * @param {Object[]} args
   * @returns {Core.AWS.IAM.Policy}
   */
  getAuthenticatedPolicy(...args) {
    return this._getAuthenticatedPolicy(...args);
  }

  /**
   * @param {Object[]} args
   * @returns {Core.AWS.IAM.Policy}
   */
  getUnauthenticatedPolicy(...args) {
    return this._getUnauthenticatedPolicy(...args);
  }

  /**
   * @param {Provisioning/Instance} provisioning
   * @returns {AbstractProvider}
   */
  static create(provisioning) {
    // move to import when get rid of babel transpiler
    let ProviderProto = provisioning.property.accountMicroservice ?
      require('./SecuredProvider').SecuredProvider :
      require('./UnsecuredProvider').UnsecuredProvider;

    return new ProviderProto(provisioning);
  }

  /**
   * @returns {Provisioning/Instance}
   */
  get provisioning() {
    return this._provisioning;
  }

  /**
   * @returns {LambdaService}
   */
  get lambdaService() {
    return this.provisioning.services.find(LambdaService);
  }
}
