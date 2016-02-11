/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

/**
 * throws on invalid microservice configuration
 */
export class InvalidConfigException extends Exception {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }
}
