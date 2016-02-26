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
    let payload = {
      DeepApplicationId: this._property.identifier,
      DeepDeployId: this._property.deployId,
      DeepEnvironmentId: this._envId,
      DeepEnvironmentName: this._property.env,
    };

    if (this._applicationName) {
      payload.DeepApplicationName = this._applicationName;
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
}
