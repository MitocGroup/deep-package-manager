/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractDriver extends Core.OOP.Interface {
  constructor() {
    super(['injectIntoRequest', 'authorize']);
  }
}
