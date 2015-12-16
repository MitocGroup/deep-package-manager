/**
 * Created by AlexanderC on 12/15/15.
 */

'use strict';

import {Exec} from '../Helpers/Exec';

export class Optimizer {
  /**
   * @param {String} path
   */
  constructor(path) {
    this._path = path;

    this._compressionLevel = Optimizer.COMPRESSION_LEVEL;
  }

  /**
   * @param {Function} callback
   * @returns {Optimizer}
   */
  optimize(callback = () => {}) {
    console.log(`Optimize frontend in '${this._path}' by compressing it`);

    let cmd = new Exec(
      'find', // find
      '.', // in current directory
      '-type f', // all files
      '! -name "*.gz"', // that don't haven the .gz extension
      `-exec gzip -${this._compressionLevel} "{}" \\;`, // compress using desired level
      '-exec mv "{}.gz" "{}" \\;' // restore files original names
    );
    cmd.cwd = this._path;

    cmd
      .avoidBufferOverflow()
      .run((result) => {
        if (result.failed) {
          callback(result.error);
          return;
        }

        callback(null);
      });
  }

  /**
   * @returns {Number}
   */
  get compressionLevel() {
    return this._compressionLevel;
  }

  /**
   * @param {Number} level
   */
  set compressionLevel(level) {
    this._compressionLevel = parseInt(level);
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {Number}
   */
  static get COMPRESSION_LEVEL() {
    return 9;
  }
}
