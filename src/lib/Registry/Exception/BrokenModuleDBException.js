/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {RegistryException} from './RegistryException';

export class BrokenModuleDBException extends RegistryException {
  /**
   * @param {Context} moduleContext
   */
  constructor(moduleContext) {
    super(`Unable to decode module DB file for ${moduleContext}`);
  }
}
