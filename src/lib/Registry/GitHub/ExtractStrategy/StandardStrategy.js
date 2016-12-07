/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import fse from 'fs-extra';
import path from 'path';
import {AbstractStrategy} from './AbstractStrategy';

export class StandardStrategy extends AbstractStrategy {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._advancedMatcher = null;
  }

  /**
   * @param {String} shortDependencyName
   * @returns {StandardStrategy}
   */
  advancedMatcherFromDeepDepShortName(shortDependencyName) {
    let dependencyBase = shortDependencyName
      .replace(/^deep(-microservices)?-/i, '');

    let matchRegexp = new RegExp(
      `^\/?src\/(deep(-microservices)?-)?${dependencyBase}\/`,
      'i'
    );

    this._advancedMatcher = (filePath) => {
      return matchRegexp.test(filePath);
    };

    return this;
  }

  /**
   * @param {String} filePath
   * @param {Stream|Writable|Readable|stream.Readable|stream.Writable|*} stream
   * @param {Function} cb
   */
  extract(filePath, stream, cb) {
    if (!this._haveToDump(filePath)) {
      stream.resume().on('end', cb);
      return;
    }

    let file = path.join(this.dumpPath, StandardStrategy.normalizeFilePath(filePath));
    let output = fse.createOutputStream(file);

    output.on('finish', cb);

    stream.pipe(output);
  }

  /**
   * @param {String} filePath
   * @returns {Boolean}
   * @private
   */
  _haveToDump(filePath) {
    return /^\/?src\/[A-Z][^\/]+\//.test(filePath) ||
      (this._advancedMatcher && this._advancedMatcher(filePath));
  }

  /**
   * @param {String} filePath
   * @returns {String}
   */
  static normalizeFilePath(filePath) {
    return filePath.replace(/^(\/?src\/[^\/]+\/)/i, '');
  }
}
