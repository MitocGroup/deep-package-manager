/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from '../Service/AbstractService';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Object} awsService
   * @param {Boolean} debug
   */
  constructor(awsService, debug = false) {
    super(['_execute', 'service']);

    this._awsService = awsService;
    this._debug = debug;
    this._stack = [];
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
   * @param {Function} cb
   * @param {Object} rawResourcesObj
   * @returns {AbstractDriver}
   */
  execute(cb, rawResourcesObj) {
    let resources = this._extractResources(rawResourcesObj);

    this._logHeader();

    this._execute((error) => {
      let removedResources = error ? null : this.extractResetStack;

      if (removedResources) {
        this._log(`There are ${removedResources.length} resources removed for ${this.service()}`);
      } else {
        this._log(`There a no matching resources for ${this.service()}`);
      }

      cb(error, removedResources);
    }, resources);

    return this;
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
   * @private
   */
  _logHeader() {
    this._log(`Starting undeploy for ${this.service()}`);
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
}
