/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import Core from 'deep-core';


/**
 * Thrown when any exception occurs
 */
export class Exception extends Core.Exception.Exception {
  /**
   * @param {String|*} args
   */
  constructor(...args) {
    super(...args);
  }
}