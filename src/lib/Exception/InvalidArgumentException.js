/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from './Exception';

/**
 * throws when invalid argument provided
 */
export class InvalidArgumentException extends Exception {
  /**
   * @param {*} argument
   * @param {String} meantType
   */
  constructor(argument, meantType) {
    let argumentType = typeof argument;

    super(`Invalid argument ${argument} of type ${argumentType} provided (meant ${meantType}).`);
  }
}
