 /**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import JsonFile from 'jsonfile';
import Joi from 'joi';
import deepPackageSchema from './deepkg.schema';
import {InvalidConfigException} from './Exception/InvalidConfigException';

/**
 * Microservice configuration loader
 */
export class Config {
  /**
   * @param {Object} rawConfig
   */
  constructor(rawConfig = {}) {
    this._rawConfig = rawConfig;

    this._parsedObject = Joi.validate(this._rawConfig, deepPackageSchema);
  }

  /**
   * @returns {Object}
   */
  get rawConfig() {
    return this._rawConfig;
  }

  /**
   * Validates raw object
   *
   * @returns {Boolean}
   */
  get valid() {
    return !this.error;
  }

  /**
   * Retrieve parse error if available
   *
   * @returns {String}
   */
  get error() {
    return this._parsedObject.error;
  }

  /**
   * Extracts parsed configuration
   *
   * @returns {Object}
   */
  extract() {
    if (!this.valid) {
      throw new InvalidConfigException(this.error);
    }

    return this._parsedObject.value;
  }

  /**
   * Read microservice configuration from json file
   *
   * @param {String} file
   */
  static createFromJsonFile(file) {
    let rawConfig = JsonFile.readFileSync(file);

    return new Config(rawConfig);
  }
}
