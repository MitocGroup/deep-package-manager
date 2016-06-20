/**
 * Created by CCristi on 6/20/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractModuleInstance extends Core.OOP.Interface {
  constructor() {
    super(['extract', 'load']);
  }
}
