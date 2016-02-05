/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import path from 'path';

export class FSDriver extends AbstractDriver {
  /**
   * @param {String} basePath
   */
  constructor(basePath) {
    super();

    this._basePath = basePath;
  }

  /**
   * @returns {String}
   */
  get basePath() {
    return this._basePath;
  }

  /**
   * @param {Module|*} module
   * @param {Function} cb
   */
  dump(module, cb) {
    module.extract(path.join(this._basePath, module.moduleName), cb);
  }
}
