/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception as BaseException} from '../../Exception/Exception';

/**
 * throws when duplicate property root found
 */
export class Exception extends BaseException {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }
}
