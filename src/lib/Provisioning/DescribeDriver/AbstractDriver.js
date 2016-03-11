/**
 * Created by mgoria on 3/11/16.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from '../Service/AbstractService';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Object} awsService
   * @param {Object|null} deployCfg
   */
  constructor(awsService, deployCfg = null) {
    super(['describe']);

    this._awsService = awsService;
    this._deployCfg = deployCfg;
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
}
