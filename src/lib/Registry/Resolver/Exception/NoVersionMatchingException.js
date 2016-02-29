/**
 * Created by AlexanderC on 2/4/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class NoVersionMatchingException extends RegistryException {
  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {ModuleDB} moduleDB
   */
  constructor(moduleName, moduleVersion, moduleDB) {
    super(`No matching version of '${moduleName}' found. '${moduleVersion}' --> (${moduleDB.getVersions().join(', ')})`);
  }
}
