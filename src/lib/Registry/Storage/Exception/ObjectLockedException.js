/**
 * Created by AlexanderC on 2/8/16.
 */

'use strict';

import {RegistryException} from '../../Exception/RegistryException';

export class ObjectLockedException extends RegistryException {
  constructor(...args) {
    super(...args);
  }
}
