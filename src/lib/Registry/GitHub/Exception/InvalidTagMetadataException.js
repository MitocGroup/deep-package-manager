/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class InvalidTagMetadataException extends RegistryException {
  /**
   * @param {String|Error|*} error
   */
  constructor(error) {
    super(`Invalid tag metadata: ${error}`);
  }
}
