/**
 * Created by CCristi on 6/20/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractModuleDB extends Core.OOP.Interface {
  constructor() {
    super(['getVersions', 'addVersion', 'dump']);
  }
}
