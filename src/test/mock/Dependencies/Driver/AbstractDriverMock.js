/**
 * Created by vcernomschi on 1/5/16.
 */

'use strict';

import {AbstractDriver} from '../../../../lib/Dependencies/Driver/AbstractDriver';

/**
 * Dependency driver implements abstract methods from AbstractDriver
 */
export class AbstractDriverMock extends AbstractDriver{
  constructor() {
    super();
  }

  pull() {
    return this;
  }

  push() {
    return this;
  }
}