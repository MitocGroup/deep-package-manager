/**
 * Created by AlexanderC on 11/26/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class MissingProvisioningConfig extends Exception {
  /**
   * @param {*} parts
   */
  constructor(...parts) {
    super(`Missing provisioning config in ${parts.join(' -> ')}`);
  }
}