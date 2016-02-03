/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class BrokenModuleDBException extends Exception {
  /**
   * @param {String} moduleName
   */
  constructor(moduleName) {
    super(`Unable to decode module DB file for ${moduleName}`);
  }
}