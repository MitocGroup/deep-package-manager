/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

import {Exception} from './Exception';
import OS from 'os';

export class InvalidValuesException extends Exception {
  constructor(validationErrors) {
    super(InvalidValuesException._buildPlainError(validationErrors));

    this._rawErrors = validationErrors;
  }

  /**
   * @returns {Object[]}
   */
  get rawErrors() {
    return this._rawErrors;
  }

  /**
   * @returns {String}
   * @private
   */
  static _buildPlainError(validationErrors) {
    let plainError = `Validation errors:${OS.EOL}`;

    for (let i in validationErrors) {
      if (!validationErrors.hasOwnProperty(i)) {
        continue;
      }

      let errorObject = validationErrors[i];

      if (errorObject.valid) {
        continue;
      }

      plainError += `- Invalid value '${errorObject.value}' for key '${errorObject.key}': failed on rule '${errorObject.rule}' with attribute '${errorObject.attr}'${OS.EOL}`;
    }

    return plainError;
  }
}
