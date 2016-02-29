/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';

export class FSDriver extends AbstractDriver {
  /**
   * @param {String} dir
   */
  constructor(dir) {
    super();

    this._dir = dir;
  }

  /**
   * @returns {String}
   */
  get dir() {
    return this._dir;
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  hasObj(objPath, cb) {
    fs.exists(this._resolvePath(objPath), (exists) => {
      cb(null, exists);
    });
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  readObj(objPath, cb) {
    fs.readFile(this._resolvePath(objPath), (error, data) => {
      cb(error, data ? data.toString() : null);
    });
  }

  /**
   * @param {String} objPath
   * @param {String|*} data
   * @param {Function} cb
   */
  putObj(objPath, data, cb) {
    fse.outputFile(this._resolvePath(objPath), data.toString(), cb);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  deleteObj(objPath, cb) {
    fse.remove(this._resolvePath(objPath), cb);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  lockObj(objPath, cb) {
    this.putObj(FSDriver._lockObjPath(objPath), '', cb);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  isObjLocked(objPath, cb) {
    this.hasObj(FSDriver._lockObjPath(objPath), cb);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  releaseObjLock(objPath, cb) {
    this.deleteObj(FSDriver._lockObjPath(objPath), cb);
  }

  /**
   * @param {String} objPath
   * @returns {String}
   * @private
   */
  _resolvePath(objPath) {
    return path.join(
      this._dir,
      objPath.replace(/(?:\\|\/)/, path.sep)
    );
  }

  /**
   * @param {String} objPath
   * @returns {String}
   * @private
   */
  static _lockObjPath(objPath) {
    return `${path.dirname(objPath)}/.${path.basename(objPath)}.lock`;
  }
}
