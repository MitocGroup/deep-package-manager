/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from '../Service/AbstractService';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Object} awsService
   * @param {String} baseHash
   */
  constructor(awsService, baseHash) {
    super(['list']);

    this._awsService = awsService;
    this._baseHash = baseHash;
    this._stack = {};
  }

  /**
   * @param {String} resourceToMatch
   * @param {String} resourceId
   * @param {Object} rawData
   * @private
   */
  _checkPushStack(resourceToMatch, resourceId, rawData = {}) {
    if (this._matchResource(resourceToMatch)) {
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
   * @returns {String}
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
   * @returns {Boolean}
   * @private
   */
  _matchResource(resource) {
    return AbstractService.extractBaseHashFromResourceName(resource) === this._baseHash;
  }
}
