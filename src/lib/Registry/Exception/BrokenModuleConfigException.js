/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {RegistryException} from './RegistryException';

export class BrokenModuleConfigException extends RegistryException {
  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   */
  constructor(moduleName, moduleVersion) {
    super(`Unable to decode module config for ${moduleName}@${moduleVersion}`);
  }
}
