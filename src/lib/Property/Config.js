/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import JsonFile from 'jsonfile';
import Joi from 'joi';
import appConfigSchema from './config.schema';
import {InvalidConfigException} from './Exception/InvalidConfigException';

/**
 * Application configuration loader
 */
export class Config {
  /**
   * @param {Object} rawConfig
   */
  constructor(rawConfig = {}) {
    this._rawConfig = rawConfig;

    this._parsedObject = Joi.validate(this._rawConfig, appConfigSchema.validation());
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

    let config = this._parsedObject.value;

    // set aws region as default region into property config
    config.awsRegion = config.aws.region;

    return config;
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_FILENAME() {
    return 'deeploy.json';
  }

  /**
   * @returns {Object}
   */
  static generate() {
    return Joi.validate({}, appConfigSchema.generation()).value;
  }

  /**
   * Read app configuration from json file
   *
   * @param {String} file
   */
  static createFromJsonFile(file) {
    let rawConfig = JsonFile.readFileSync(file);

    return new Config(rawConfig);
  }
}
