/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from '../../Service/AbstractService';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Property|Instance|*} property
   * @param {String|null} applicationName
   */
  constructor(property, applicationName = null) {
    super(['tag']);

    this._property = property;
    this._applicationName = applicationName;
  }

  /**
   * @returns {String|null}
   */
  get applicationName() {
    return this._applicationName;
  }

  /**
   * @returns {Property|Instance|*}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Provisioning|Instance|*}
   */
  get provisioning() {
    return this._property.provisioning;
  }

  /**
   * @returns {{DeepApplicationId: String, DeepDeployId: String, DeepEnvironmentId: *, DeepEnvironmentName: String}[]}
   */
  get tagsPayload() {
    let payload = [];
    let tags = this.tags;

    for (let name in tags) {
      if (!tags.hasOwnProperty(name)) {
        continue;
      }

      payload.push({
        Key: name,
        Value: tags[name],
      });
    }

    return payload;
  }

  /**
   * @returns {{DeepApplicationId: String, DeepDeployId: String, DeepEnvironmentId: *, DeepEnvironmentName: String}}
   */
  get tags() {
    let payload = {};

    payload[AbstractDriver.APPLICATION_ID_KEY] = this._property.identifier;
    payload[AbstractDriver.DEPLOY_ID_KEY] = this._property.deployId;
    payload[AbstractDriver.ENVIRONMENT_ID_KEY] = this._envId;
    payload[AbstractDriver.ENVIRONMENT_NAME_KEY] = this._property.env;

    if (this._applicationName) {
      payload[AbstractDriver.APPLICATION_NAME_KEY] = this._applicationName;
    }

    return payload;
  }

  /**
   * @private
   */
  get _envId() {
    return AbstractService.generateUniqueResourceHash(
      this._property.config.awsAccountId,
      this._property.identifier
    );
  }

  /**
   * @returns {String}
   */
  static get DEPLOY_ID_KEY() {
    return 'DeepDeployId';
  }


  /**
   * @returns {String}
   */
  static get APPLICATION_NAME_KEY() {
    return 'DeepApplicationName';
  }

  /**
   * @returns {String}
   */
  static get APPLICATION_ID_KEY() {
    return 'DeepApplicationId';
  }

  /**
   * @returns {String}
   */
  static get ENVIRONMENT_NAME_KEY() {
    return 'DeepEnvironmentName';
  }

  /**
   * @returns {String}
   */
  static get ENVIRONMENT_ID_KEY() {
    return 'DeepEnvironmentId';
  }
}
