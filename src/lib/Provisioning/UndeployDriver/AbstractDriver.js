/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from '../Service/AbstractService';
import {WaitFor} from '../../Helpers/WaitFor';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Object} awsService
   * @param {Boolean} debug
   */
  constructor(awsService, debug = false) {
    super(['_removeResource', 'service']);

    this._awsService = awsService;
    this._debug = debug;
    this._stack = [];
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
      } else if(!error) {
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

      this._removeResource(resourceId, resourceData, (error) => {
        resourcesRemaining--;

        if (!error) {
          this._pushStack(resourceId);
          return;
        }

        this._logError(`Error while removing resource #${resourceId}: ${error}`);
      });
    }

    wait.ready(() => {
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
   * @param {String} service
   * @param {String} credentials
   */
  static injectServiceCredentials(service, credentials) {
    Object.defineProperty(service, AbstractDriver.CREDENTIALS_KEY, {
      value: credentials,
      enumerable: false,
      configurable: false,
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
