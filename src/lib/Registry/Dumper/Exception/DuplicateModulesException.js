/**
 * Created by AlexanderC on 2/18/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';
import OS from 'os';

export class DuplicateModulesException extends RegistryException {
  /**
   * @param {Object} duplicatesStack
   */
  constructor(duplicatesStack) {
    super(
      `The following duplicates found:${OS.EOL}${DuplicateModulesException._createDuplicatesStack(duplicatesStack)}`
    );
  }

  /**
   * @param {String} duplicatesStack
   * @returns {String}
   * @private
   */
  static _createDuplicatesStack(duplicatesStack) {
    let stackPlain = '';

    for (let depName in duplicatesStack) {
      if (!duplicatesStack.hasOwnProperty(depName)) {
        continue;
      }

      let depVersions = duplicatesStack[depName];

      stackPlain += `- ${depName}: ${depVersions.join(', ')}${OS.EOL}`;
    }

    return stackPlain;
  }
}
