/**
 * Created by vcernomschi on 10/19/15.
 */

'use strict';

import {Instance} from '../../lib.compiled/Property/Instance';

/**
 * Property instance
 */
export class InstanceMock extends Instance {
  /**
   * @param {String} path
   * @param {String} configFileName
   */
  constructor(path, configFileName = Config.DEFAULT_FILENAME) {
    super(path, configFileName);
  }
}
