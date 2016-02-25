/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import {RegistryException} from '../../../../../Exception/RegistryException';

export class InvalidRegistryConfigException extends RegistryException {
  /**
   * @param {Error|String|*} error
   */
  constructor(error) {
    super(`Invalid registry config object: ${error}`);
  }
}
