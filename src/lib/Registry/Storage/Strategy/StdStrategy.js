/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import {Instance as Microservice} from '../../../Microservice/Instance';
import {ModuleInstance} from '../../ModuleInstance';

export class StdStrategy extends AbstractStrategy {
  constructor() {
    super();
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @returns {String}
   */
  getModuleBaseLocation(moduleName, moduleVersion) {
    return `${moduleName}/@${moduleVersion}`;
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @returns {*}
   */
  getModuleConfigLocation(moduleName, moduleVersion) {
    return `${this.getModuleBaseLocation(moduleName, moduleVersion)}/${Microservice.CONFIG_FILE}`;
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @returns {*}
   */
  getModuleLocation(moduleName, moduleVersion) {
    return `${this.getModuleBaseLocation(moduleName, moduleVersion)}/${StdStrategy.MODULE_FILE}`;
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
  static get MODULE_FILE() {
    return `module.${ModuleInstance.ARCHIVE_EXTENSION}`;
  }

  /**
   * @returns {String}
   */
  static get DB_FILE() {
    return 'db.json';
  }
}
