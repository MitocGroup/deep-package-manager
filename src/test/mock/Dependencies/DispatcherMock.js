/**
 * Created by vcernomschi on 1/5/16.
 */

'use strict';

import {Dispatcher} from '../../../lib/Dependencies/Dispatcher';

/**
 * Dependency dispatcher implements abstract method from Dispatcher
 */
export class DispatcherMock extends Dispatcher {
  constructor(driver) {
    super(driver);
  }

  dispatch() {
    return this;
  }
}
