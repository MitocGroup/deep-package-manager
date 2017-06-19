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
   * @param {String} env
   * @param {Object|null} deployCfg
   *
   * @todo: rename base hash
   */
  constructor(awsService, baseHash, env, deployCfg = null) {
    super(['list']);

    this._awsService = awsService;
    this._baseHash = baseHash;
    this._env = env;
    this._deployCfg = deployCfg;
    this._stack = {};
  }

  /**
   * @returns {string}
   */
  static get UNKNOWN_HASH() {
    return 'unknown';
  }

  static get AVAILABLE_REGIONS() {
    throw new Error(`AVAILABLE_REGIONS method should be implemented into child class.`);
  }

  /**
   * @param {String} resourceToMatch
   * @param {String} resourceId
   * @param {Object} rawData
   * @private
   */
  _checkPushStack(resourceToMatch, resourceId, rawData = {}) {
    let resourceHash = AbstractService.extractBaseHashFromResourceName(resourceToMatch) || AbstractDriver.UNKNOWN_HASH;

    if (this._matchResource(resourceToMatch, rawData)) {
      this._stack[resourceHash] = this._stack[resourceHash] || {};

      this._stack[resourceHash][resourceId] = rawData;
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
    let resourceEnv = AbstractService.extractEnvFromResourceName(resource);

    // do we need to check env only for typeof hash = string ?
    if (!resourceEnv) {
      console.warn(`Cannot extract env from ${resource} resource.`);
    } else if (resourceEnv !== this._env) {
      return false;
    }

    if (typeof this.baseHash === 'function') {
      return this.baseHash.bind(this)(resource);
    } else if (this.baseHash instanceof RegExp) {
      return this.baseHash.test(resource);
    }

    return AbstractService.extractBaseHashFromResourceName(resource) === this.baseHash;
  }

  /**
   * @param {AWS.Request|Object} request
   * @param {String[]} retryableCodes
   * @param {Number} delay
   * @returns {AWS.Request|Object}
   */
  _retryableRequest(request, retryableCodes = ['ResourceInUseException', 'Throttling'], delay = 5000) {
    request.on('retry', response => {
      if (retryableCodes.indexOf(response.error.code) !== -1) {
        response.error.retryable = true;
        response.error.retryDelay = delay;
      }
    });

    return request;
  }
}
