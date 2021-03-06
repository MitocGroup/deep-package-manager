/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {WaitFor} from '../../Helpers/WaitFor';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   *
   * @param {Object} awsService
   * @param {String} baseHash
   * @param {Boolean} debug
   */
  constructor(awsService, baseHash, debug = false) {
    super(['_removeResource', 'service']);

    this._awsService = awsService;
    this._baseHash = baseHash;
    this._debug = debug;
    this._stack = [];
    this._retries = AbstractDriver.DEFAULT_RETRIES;
  }

  /**
   * @param {Number} retries
   */
  set retries(retries) {
    this._retries = retries;
  }

  /**
   * @returns {Number}
   */
  get retries() {
    return this._retries;
  }

  /**
   * @returns {String}
   */
  get baseHash() {
    return this._baseHash;
  }

  /**
   * @param {Function} cb
   * @param {Object} rawResourcesObj
   * @returns {AbstractDriver}
   */
  execute(cb, rawResourcesObj) {
    let resources = this._extractResources(rawResourcesObj);

    this._log(`Starting undeploy for ${this.service()}`);

    this._execute((error) => {
      let removedResources = error ? null : this.extractResetStack;

      if (removedResources && removedResources.length > 0) {
        this._log(`There are ${removedResources.length} resources removed from ${this.service()}`);
      } else if (!error) {
        this._log(`No resources to remove for ${this.service()}`);
      } else {
        this._logError(`An error occurred when working with ${this.service()}: ${error}`);
      }

      cb(error, removedResources);
    }, resources);

    return this;
  }

  /**
   * @param {Function} cb
   * @param {Object} resources
   */
  _execute(cb, resources) {
    let wait = new WaitFor();
    let resourcesRemaining = resources.length;
    let resourceIds = [];

    wait.push(() => {
      return resourcesRemaining <= 0;
    });

    for (let i in resources) {
      if (!resources.hasOwnProperty(i)) {
        continue;
      }

      let resourceInfo = resources[i];
      let resourceId = resourceInfo.id;
      let resourceData = resourceInfo.data;

      // manage duplicate resources
      if (resourceIds.indexOf(resourceId) !== -1) {
        resourcesRemaining--;
        continue;
      }

      resourceIds.push(resourceId);

      setTimeout(() => {
        this._removeResourceRetryable(resourceId, resourceData, (error) => {
          resourcesRemaining--;

          if (!error) {
            this._pushStack(resourceId);
            return;
          }

          this._logError(`Error while removing resource #${resourceId}: ${error}`);
        });
      }, i * 200);
    }

    wait.ready(() => {
      cb(null);
    });
  }

  /**
   * @param {String} resourceId
   * @param {Object|String} resourceData
   * @param {Function} cb
   * @param {Number|null} retries
   * @private
   */
  _removeResourceRetryable(resourceId, resourceData, cb, retries = null) {
    retries = retries === null ? this._retries : retries;

    this._removeResource(resourceId, resourceData, (error) => {
      if (error) {
        if (retries <= 0) {
          cb(error);
          return;
        }

        let retriesDelay = parseInt(10000 / retries);

        this._logError(
          `Retrying undeploy on ${this.service()}:${resourceId} in ${retriesDelay} ms due to the error: ${error}`
        );

        setTimeout(() => {
          this._removeResourceRetryable(resourceId, resourceData, cb, retries - 1);
        }, retriesDelay);
        return;
      }

      cb(null);
    });
  }

  /**
   * @param {String} resourceId
   * @private
   */
  _pushStack(resourceId) {
    this._log(`Removing resource #${resourceId} from ${this.service()}`);

    this._stack.push(resourceId);
  }

  /**
   * @returns {Object}
   */
  get extractResetStack() {
    let stack = this._stack;

    this._stack = [];

    return stack;
  }

  /**
   * @returns {Object}
   */
  get awsService() {
    return this._awsService;
  }

  /**
   * @returns {Boolean}
   */
  get debug() {
    return this._debug;
  }

  /**
   * @param {Boolean} state
   */
  set debug(state) {
    this._debug = state;
  }

  /**
   * @param {Object} service
   * @param {String} credentials
   */
  static injectServiceCredentials(service, credentials) {
    Object.defineProperty(service, AbstractDriver.CREDENTIALS_KEY, {
      value: credentials,
      enumerable: false,
      configurable: true,
      writable: false,
    });
  }

  /**
   * @returns {String}
   */
  static get CREDENTIALS_KEY() {
    return '__deep_undeploy_cred__';
  }

  /**
   * @returns {Object}
   * @private
   */
  get _credentials() {
    if (this._awsService.hasOwnProperty(AbstractDriver.CREDENTIALS_KEY)) {
      return this._awsService[AbstractDriver.CREDENTIALS_KEY];
    }

    return null;
  }

  /**
   * @param {Object} rawResourcesObj
   * @returns {Object[]}
   */
  _extractResources(rawResourcesObj) {
    let service = this.service();
    let resourcesVector = [];

    if (rawResourcesObj.hasOwnProperty(service)) {
      for (let resourceId in rawResourcesObj[service]) {
        if (!rawResourcesObj[service].hasOwnProperty(resourceId)) {
          continue;
        }

        let resourceData = rawResourcesObj[service][resourceId];

        resourcesVector.push({
          id: resourceId,
          data: resourceData,
        });
      }
    }

    return resourcesVector;
  }

  /**
   * @returns {Number}
   * @constructor
   */
  static get DEFAULT_RETRIES() {
    return 3;
  }

  /**
   * @todo: abstract this?
   *
   * @param {*} args
   * @private
   */
  _log(...args) {
    this._debug && console.log(...args);
  }

  /**
   * @todo: abstract this?
   *
   * @param {*} args
   * @private
   */
  _logError(...args) {
    this._debug && console.error(...args);
  }
}
