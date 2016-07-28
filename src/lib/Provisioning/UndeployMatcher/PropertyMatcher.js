/**
 * Created by AlexanderC on 11/25/15.
 */

'use strict';

import {AbstractService} from '../Service/AbstractService';
import {AbstractMatcher} from './AbstractMatcher';

export class PropertyMatcher extends AbstractMatcher {
  /**
   * @param {Property|*} property
   */
  constructor(property) {
    super();

    this._property = property;
  }

  /**
   * @returns {String}
   */
  get env() {
    return this._property.config.env;
  }

  /**
   * @returns {String}
   */
  get baseHash() {
    return this._property.configObj.baseHash;
  }

  /**
   * @returns {Property|*}
   */
  get property() {
    return this._property;
  }

  /**
   * @param {String} type
   * @param {String} resourceId
   * @returns {Boolean}
   */
  match(type, resourceId) {
    let baseHash = AbstractService.extractBaseHashFromResourceName(resourceId);
    let env = AbstractService.extractEnvFromResourceName(resourceId);

    return baseHash === this.baseHash && env === this.env;
  }
}
