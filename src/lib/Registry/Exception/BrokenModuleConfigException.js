/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class BrokenModuleConfigException extends Exception {
  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   */
  constructor(moduleName, moduleVersion) {
    super(`Unable to decode module config for ${moduleName}@${moduleVersion}`);
  }
}
