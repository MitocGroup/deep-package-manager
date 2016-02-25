/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import Joi from 'joi';
import registrySchema from './registry.schema';
import {InvalidRegistryConfigException} from './Exception/InvalidRegistryConfigException';

export class RegistryConfig {
  /**
   * @param {Object} configObj
   */
  constructor(configObj) {
    this._rawConfig = configObj;

    this._parsedObject = Joi.validate(this._rawConfig, registrySchema);
  }

  /**
   * @returns {Object}
   */
  get rawConfig() {
    return this._rawConfig;
  }

  /**
   * @returns {Boolean}
   */
  get valid() {
    return !this.error;
  }

  /**
   * @returns {String}
   */
  get error() {
    return this._parsedObject.error;
  }

  /**
   * @returns {Object}
   */
  extract() {
    if (!this.valid) {
      throw new InvalidRegistryConfigException(this.error);
    }

    return this._parsedObject.value;
  }
}
