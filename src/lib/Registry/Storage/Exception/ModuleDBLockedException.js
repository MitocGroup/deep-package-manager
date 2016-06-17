/**
 * Created by AlexanderC on 2/8/16.
 */

'use strict';

import {ObjectLockedException} from './ObjectLockedException';

export class ModuleDBLockedException extends ObjectLockedException {
  /**
   * @param {Context} moduleContext
   */
  constructor(moduleContext) {
    super(`The module '${moduleContext.name}' DB file is locked`);
  }
}
