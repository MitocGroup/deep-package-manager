/**
 * Created by vcernomschi on 10/19/15.
 */

'use strict';

import {Instance} from '../../../lib/Property/Instance';

/**
 * Property instance
 */
export class PropertyInstanceMock extends Instance {
  /**
   * @param {String} path
   * @param {String} configFileName
   */
  constructor(path, configFileName = Config.DEFAULT_FILENAME) {
    super(path, configFileName);
  }
}
