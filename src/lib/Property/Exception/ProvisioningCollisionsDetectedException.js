/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import {Exception} from '../../Exception/Exception';
import OS from 'os';

export class ProvisioningCollisionsDetectedException extends Exception {
  /**
   * @param {Object} resourcesObj
   */
  constructor(resourcesObj) {
    let plainError = ProvisioningCollisionsDetectedException._stringifyResourcesObj(resourcesObj);

    super(`The following AWS resources may collision:${OS.EOL}${plainError}`);

    this._resourcesObj = resourcesObj;
  }

  /**
   * @param {Object} resourcesObj
   * @returns {String}
   * @private
   */
  static _stringifyResourcesObj(resourcesObj) {
    let output = '';

    for (let resourceName in resourcesObj) {
      if (!resourcesObj.hasOwnProperty(resourceName)) {
        continue;
      }

      let resources = resourcesObj[resourceName];
      let resourcesKeys = Object.keys(resources);

      if (resourcesKeys.length > 0) {
        output += `- ${resourceName}: ${resourcesKeys.join(', ')}${OS.EOL}`;
      }
    }

    return output;
  }

  /**
   * @returns {Object}
   */
  get resourcesObj() {
    return this._resourcesObj;
  }
}
