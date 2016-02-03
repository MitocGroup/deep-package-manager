/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';

export class StdStrategy extends AbstractStrategy {
  constructor() {
    super();
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @returns {*}
   */
  getModuleLocation(moduleName, moduleVersion) {
    return `${moduleName}/@${moduleVersion}`;
  }

  /**
   * @param {String} moduleName
   * @returns {String}
   */
  getDbLocation(moduleName) {
    return `${moduleName}/${StdStrategy.DB_FILE}`;
  }

  /**
   * @returns {String}
   */
  static get DB_FILE() {
    return 'db.json';
  }
}
