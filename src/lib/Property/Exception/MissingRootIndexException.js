/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

/**
 * throws when missing property root index.html file
 */
export class MissingRootIndexException extends Exception {
  /**
   * @param {String} identifier
   */
  constructor(identifier) {
    super(`Missing root application (${identifier}) index.html bootstrap file (application entry point)`);
  }
}
