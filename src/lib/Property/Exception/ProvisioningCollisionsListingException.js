/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import {Exception} from '../../Exception/Exception';
import OS from 'os';

export class ProvisioningCollisionsListingException extends Exception {
  /**
   * @param {Object} errorsObj
   */
  constructor(errorsObj) {
    let plainError = ProvisioningCollisionsListingException._stringifyErrorsObj(errorsObj);

    super(`Error while listing AWS resources:${OS.EOL}${plainError}`);

    this._errorsObj = errorsObj;
  }

  /**
   * @param {Object} errorsObj
   * @returns {String}
   * @private
   */
  static _stringifyErrorsObj(errorsObj) {
    let output = '';

    for (let resourceName in errorsObj) {
      if (!errorsObj.hasOwnProperty(resourceName)) {
        continue;
      }

      let error = errorsObj[resourceName];

      output += `- ${resourceName}: ${error}${OS.EOL}`;
    }

    return output;
  }

  /**
   * @returns {Object}
   */
  get errorsObj() {
    return this._errorsObj;
  }
}
