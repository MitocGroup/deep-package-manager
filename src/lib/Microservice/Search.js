/**
 * Created by AlexanderC on 1/6/16.
 */

'use strict';

import JsonFile from 'jsonfile';
import Joi from 'joi';
import searchSchema from './search.schema';
import {InvalidSearchSchemaException} from './Exception/InvalidSearchSchemaException';

export class Search {
  /**
   * @param {Object} rawConfig
   */
  constructor(rawConfig = {}) {
    this._rawConfig = rawConfig;

    this._parsedObject = Joi.validate(this._rawConfig, searchSchema);
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
      throw new InvalidSearchSchemaException(this.error);
    }

    return this._parsedObject.value;
  }

  /**
   * @param {String} file
   */
  static createFromJsonFile(file) {
    let rawConfig = JsonFile.readFileSync(file);

    return new Search(rawConfig);
  }
}
