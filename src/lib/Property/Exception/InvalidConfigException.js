/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

/**
 * Throws on invalid application configuration
 */
export class InvalidConfigException extends Exception {
  /**
   * @param {ValidationError|*} validationError
   */
  constructor(validationError) {
    super(InvalidConfigException._buildMsg(validationError));

    this._validationError = validationError;
  }

  /**
   * @returns {ValidationError|*}
   */
  get validationError() {
    return this._validationError;
  }

  /**
   * @param {ValidationError|*} validationError
   * @returns {String}
   * @private
   */
  static _buildMsg(validationError) {
    let messages = [];

    validationError.details.forEach((detail) => {
      messages.push(detail.message);
    });

    return `Configuration error: ${messages.join(', ')}`;
  }
}
