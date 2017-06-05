/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

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
   * @returns {String}
   */
  get stringifiedErrorsObj() {
    return ProvisioningCollisionsListingException._stringifyErrorsObj(
      this._errorsObj
    );
  }

  /**
   * @param {Object} result
   * @returns {String}
   * @private
   */
  static _stringifyErrorsObj(result) {
    // back compatibility hook for old result format
    if (result.hasOwnProperty('errors')) {
      return ProvisioningCollisionsListingException._stringifyErrors(result.errors);
    }

    let output = '';

    for (let regionName in result) {
      if (!result.hasOwnProperty(regionName)) {
        continue;
      }

      let regionErrors = result[regionName].errors;

      output += `Errors in ${regionName} region: ${OS.EOL}`;
      output += ProvisioningCollisionsListingException._stringifyErrors(regionErrors);
    }

    return output;
  }

  /**
   * @param {*} errorsObj
   * @returns {String}
   * @private
   */
  static _stringifyErrors(errorsObj) {
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
