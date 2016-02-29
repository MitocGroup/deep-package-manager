/**
 * Created by AlexanderC on 2/8/16.
 */

'use strict';

import {ObjectLockedException} from './ObjectLockedException';

export class ModuleDBLockedException extends ObjectLockedException {
  /**
   * @param {String} moduleName
   */
  constructor(moduleName) {
    super(`The module '${moduleName}' DB file is locked`);
  }
}
