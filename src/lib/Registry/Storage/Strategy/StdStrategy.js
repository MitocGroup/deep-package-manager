/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import {Instance as Microservice} from '../../../Microservice/Instance';
import {ModuleInstance} from '../../Module/ModuleInstance';

export class StdStrategy extends AbstractStrategy {
  constructor() {
    super();
  }

  /**
   * @param {Context} moduleContext
   * @returns {String}
   */
  getModuleBaseLocation(moduleContext) {
    return `${moduleContext.name}/@${moduleContext.version}`;
  }

  /**
   * @param {Context} moduleContext
   * @returns {*}
   */
  getModuleConfigLocation(moduleContext) {
    return `${this.getModuleBaseLocation(moduleContext)}/${Microservice.CONFIG_FILE}`;
  }

  /**
   * @param {Context} moduleContext
   * @returns {*}
   */
  getModuleLocation(moduleContext) {
    return `${this.getModuleBaseLocation(moduleContext)}/${StdStrategy.MODULE_FILE}`;
  }

  /**
   * @param {Context} moduleContext
   * @returns {String}
   */
  getDbLocation(moduleContext) {
    return `${moduleContext.name}/${StdStrategy.DB_FILE}`;
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
