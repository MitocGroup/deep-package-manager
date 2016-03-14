/**
 * Created by mgoria on 3/11/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Object} awsService
   * @param {Object} appConfig
   */
  constructor(awsService, appConfig) {
    super(['describe']);

    this._awsService = awsService;
    this._appConfig = appConfig;
    this._stack = {};
  }

  /**
   * @returns {Object}
   */
  get extractResetStack() {
    let stack = this._stack;

    this._stack = {};

    return stack;
  }

  /**
   * @returns {Object}
   */
  get awsService() {
    return this._awsService;
  }

  /**
   * @param {String} resourceId
   * @param {Object} rawData
   * @private
   */
  _pushInStack(resourceId, rawData = {}) {
    this._stack[resourceId] = rawData;
  }
}
