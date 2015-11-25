/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';

import {Undeploy} from '../Undeploy';

export class AbstractMatcher extends Core.OOP.Interface {
  constructor() {
    super(['match']);
  }

  /**
   * @param {Object} rawResourcesObj
   * @returns {Object}
   */
  filter(rawResourcesObj) {
    let resourcesObj = {};

    for (let type in rawResourcesObj) {
      if (!rawResourcesObj.hasOwnProperty(type) || !AbstractMatcher.isKnownType(type)) {
        continue;
      }

      let resourcesObjStack = rawResourcesObj[type];

      for (let resourceId in resourcesObjStack) {
        if (!resourcesObjStack.hasOwnProperty(resourceId) || !this.match(type, resourceId)) {
          continue;
        }

        if (!resourcesObj.hasOwnProperty(type)) {
          resourcesObj[type] = {};
        }

        resourcesObj[type][resourceId] = resourcesObjStack[resourceId];
      }
    }

    return resourcesObj;
  }

  /**
   * @param {String} type
   * @returns {Boolean}
   */
  static isKnownType(type) {
    return AbstractMatcher.TYPES.indexOf(type) !== -1;
  }

  /**
   * @returns {String[]}
   */
  static get TYPES() {
    return Undeploy.SERVICES;
  }
}
