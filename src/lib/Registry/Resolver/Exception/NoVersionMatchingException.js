/**
 * Created by AlexanderC on 2/4/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class NoVersionMatchingException extends RegistryException {
  /**
   * @param {Context} moduleContext
   * @param {ModuleDB} moduleDB
   */
  constructor(moduleContext, moduleDB) {
    super(
      `No matching version of '${moduleContext.name}' found. '${moduleContext.version}` +
      `--> (${moduleDB.getVersions().join(', ')})`
    );
  }
}
