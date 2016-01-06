/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class InvalidSearchSchemaException extends Exception {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }
}
