/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {ModuleConfig} from './ModuleConfig';
import fse from 'fs-extra';
import tar from 'tar-stream';

export class Module {
  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {String} rawContent
   * @param {Storage|*} storage
   */
  constructor(moduleName, moduleVersion, rawContent, storage) {
    this._moduleName = moduleName;
    this._moduleVersion = moduleVersion;
    this._storage = storage;
    this._rawContent = rawContent;
  }

  /**
   * @param {String} sourcesPath
   * @param {Function} cb
   */
  load(sourcesPath, cb) {
    // @todo: pack
  }

  /**
   * @param {String} dumpPath
   * @param {Function} cb
   */
  extract(dumpPath, cb) {
    fse.ensureDir(dumpPath, (error) => {
      if (error) {
        cb(error);
        return;
      }

      // @todo: unpack
    });
  }

  createExtractStream() {
    
  }

  /**
   * @param {Function} cb
   */
  upload(cb) {
    this._storage.uploadModule(this, cb);
  }

  /**
   * @returns {String}
   */
  toString() {
    return this._rawContent;
  }

  /**
   * @returns {String}
   */
  get rawContent() {
    return this._rawContent;
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {String}
   */
  get moduleName() {
    return this._moduleName;
  }

  /**
   * @returns {String}
   */
  get moduleVersion() {
    return this._moduleVersion;
  }

  /**
   * @returns {String}
   */
  static get ARCHIVE_EXTENSION() {
    return 'tar';
  }
}
