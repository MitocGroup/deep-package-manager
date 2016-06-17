/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class MissingModuleException extends RegistryException {
  /**
   * @param {String} moduleName
   */
  constructor(moduleName) {
    super(`'${moduleName}'`);
  }
}
