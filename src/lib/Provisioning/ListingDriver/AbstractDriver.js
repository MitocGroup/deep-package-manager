/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from '../Service/AbstractService';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Object} awsService
   * @param {String|RegExp|Function} baseHash
   * @param {Object|null} deployCfg
   *
   * @todo: rename base hash
   */
  constructor(awsService, baseHash, deployCfg = null) {
    super(['list']);

    this._awsService = awsService;
    this._baseHash = baseHash;
    this._deployCfg = deployCfg;
    this._stack = {};
  }

  /**
   * @param {String} resourceToMatch
   * @param {String} resourceId
   * @param {Object} rawData
   * @private
   */
  _checkPushStack(resourceToMatch, resourceId, rawData = {}) {
    if (this._matchResource(resourceToMatch, rawData)) {
      this._stack[resourceId] = rawData;
    }
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
   * @returns {String|RegExp}
   */
  get baseHash() {
    return this._baseHash;
  }

  /**
   * @returns {Object}
   */
  get awsService() {
    return this._awsService;
  }

  /**
   * @param {String} resource
   * @param {Object} rawData
   * @returns {Boolean}
   * @private
   */
  _matchResource(resource, rawData = {}) {
    if (typeof this.baseHash === 'function') {
      return this.baseHash.bind(this)(resource);
    } else if (this.baseHash instanceof RegExp) {
      return this.baseHash.test(resource);
    }

    return AbstractService.extractBaseHashFromResourceName(resource) === this.baseHash;
  }
}
