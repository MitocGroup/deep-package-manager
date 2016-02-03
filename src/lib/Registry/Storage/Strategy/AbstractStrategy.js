/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractStrategy extends Core.OOP.Interface {
  constructor() {
    super(['getModuleLocation', 'getDbLocation']);
  }
}
