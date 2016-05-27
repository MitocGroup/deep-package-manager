/**
 * Created by AlexanderC on 27/5/16.
 */

'use strict';

import {_extend as extend} from 'util';
import objectMerge from 'object-merge';

export class ModelSettings {
  /**
   * @param {String} name
   * @param {Object} settings
   */
  constructor(name, settings = {}) {
    this._name = name;
    this._settings = ModelSettings.DEFAULT_SETTINGS;

    this.update(settings);
  }

  /**
   * @param {Object} settings
   * @returns {ModelSettings}
   */
  update(settings) {
    this._settings = objectMerge(this._settings, settings);

    return this;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {Object}
   */
  get settings() {
    return this._settings;
  }

  /**
   * @returns {Object}
   */
  extract() {
    let obj = {};

    obj[this._name] = this._settings;

    return obj;
  }

  /**
   * @returns {Object}
   */
  static get DEFAULT_SETTINGS() {
    return {
      readCapacity: 1,
      writeCapacity: 1,
    };
  }
}
