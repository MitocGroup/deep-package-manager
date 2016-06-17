/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class MethodNotAllowedException extends RegistryException {
  /**
   * @param {String} method
   */
  constructor(method) {
    super(`'${method}' is not allowed`);
  }
}
