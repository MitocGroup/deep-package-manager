/**
 * Created by AlexanderC on 2/4/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class MissingModuleDBException extends RegistryException {
  /**
   * @param {String} moduleName
   */
  constructor(moduleName) {
    super(`Missing '${moduleName}' module DB`);
  }
}
