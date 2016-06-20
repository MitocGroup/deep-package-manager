/**
 * Created by AlexanderC on 2/5/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import path from 'path';
import fs from 'fs';

export class FSDriver extends AbstractDriver {
  /**
   * @param {String} basePath
   * @param {Boolean} appendVersion
   */
  constructor(basePath, appendVersion = false) {
    super();

    this._basePath = basePath;
    this._appendVersion = appendVersion;
  }

  /**
   * @returns {Boolean}
   */
  get appendVersion() {
    return this._appendVersion;
  }

  /**
   * @param {Boolean} state
   */
  set appendVersion(state) {
    this._appendVersion = state;
  }

  /**
   * @returns {String}
   */
  get basePath() {
    return this._basePath;
  }

  /**
   * @param {ModuleInstance|*} moduleObj
   * @param {Function} cb
   */
  dump(moduleObj, cb) {
    moduleObj.extract(this._dumpPath(moduleObj.context), cb);
  }

  /**
   * @param {Context} moduleContext
   * @param {Function} cb
   */
  hasToDump(moduleContext, cb) {
    fs.exists(this._dumpPath(moduleContext), (exists) => {
      cb(null, !exists);
    });
  }

  /**
   * @param {Context} moduleContext
   * @returns {String}
   * @private
   */
  _dumpPath(moduleContext) {
    return path.join(
      this._basePath, 
      this._appendVersion ? moduleContext.toString() : moduleContext.name
    );
  }
}
