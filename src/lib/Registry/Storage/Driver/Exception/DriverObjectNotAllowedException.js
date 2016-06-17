/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {RegistryException} from '../../../Exception/RegistryException';

export class DriverObjectNotAllowedException extends RegistryException {
  /**
   * @param {String} objPath
   */
  constructor(objPath) {
    super(`'${objPath}' is not allowed`);
  }
}
