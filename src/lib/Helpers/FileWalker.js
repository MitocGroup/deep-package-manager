/**
 * Created by AlexanderC on 6/1/15.
 */

'use strict';

import FileSystem from 'graceful-fs';
import path from 'path';
import StringUtils from 'underscore.string';
import mkdirp from 'mkdirp';
import ignore from 'ignore';

/**
 * File walker
 */
export class FileWalker {
  /**
   * @param {String} type
   * @param {String} ignoreFile
   */
  constructor(type = FileWalker.SIMPLE, ignoreFile = null) {
    this._type = type;
    this._ignoreFile = ignoreFile;
  }

  /**
   * @param {String} ignoreFile
   */
  set ignoreFile(ignoreFile) {
    this._ignoreFile = ignoreFile;
  }

  /**
   * @returns {String}
   */
  get ignoreFile() {
    return this._ignoreFile;
  }

  /**
   * @returns {String}
   */
  get type() {
    return this._type;
  }

  /**
   * @param {String} dir
   * @param {Number} mode
   * @returns {FileWalker}
   */
  mkdir(dir, mode = null) {
    if (this._type === FileWalker.RECURSIVE) {
      mkdirp.sync(dir, mode ? {mode: mode} : undefined);
    } else {
      FileSystem.mkdirSync(dir, mode);
    }

    return this;
  }

  /**
   * @param {String} source
   * @param {String} destination
   * @param {Function} filter
   * @returns {FileWalker}
   */
  copy(source, destination, filter = () => true) {
    source = StringUtils.rtrim(source, '/');
    destination = StringUtils.rtrim(destination, '/');

    let skipDotFilter = FileWalker.skipDotsFilter(filter);
    let sourceOffset = source.length + 1;

    let files = this.walk(source, skipDotFilter);

    for (let file of files) {
      let relativePath = file.substring(sourceOffset);
      let fileCopy = path.join(destination, relativePath);
      let fileDir = path.dirname(fileCopy);

      this.mkdir(fileDir);

      FileSystem.renameSync(file, fileCopy);
    }

    return this;
  }

  /**
   * @param {String} dir
   * @param {Function} filter
   * @returns {Array}
   */
  walk(dir, filter = () => true) {
    let results = [];
    let list = FileSystem.readdirSync(dir);
    let ignoreFilter = this._ignoreFile
      ? this._buildIgnoreFilter(dir)
      : () => true;

    list = list
      .map((file) => path.join(dir, file))
      .filter(ignoreFilter);

    for (let file of list) {
      if (this._type === FileWalker.RECURSIVE) {
        let stat = FileSystem.statSync(file);

        if (stat && stat.isDirectory()) {
          results = results.concat(this.walk(file, filter));
        } else if (filter(file)) {
          results.push(file);
        }
      } else if (filter(file)) {
        results.push(file);
      }
    }

    return results.filter(ignoreFilter); // assure global ignores
  }

  /**
   * @param {String} dir
   * @returns {Function}
   * @private
   */
  _buildIgnoreFilter(dir) {
    let ignoreFile = path.join(dir, this._ignoreFile);

    if (FileSystem.existsSync(ignoreFile)) {
      return ignore({})
        .addIgnoreFile(ignoreFile)
        .createFilter();
    }

    return () => true;
  }

  /**
   * @param {Function} originalFilter
   * @param {String[]} extensions
   * @returns {Function}
   */
  static matchExtensionsFilter(originalFilter, ...extensions) {
    let extensionsPlain = extensions.join('|');
    let regex = new RegExp(`\.(${extensionsPlain})$`, 'i');

    return (file) => {
      return regex.test(file) && (!originalFilter || originalFilter(file));
    };
  }

  /**
   * @param {Function} originalFilter
   * @returns {Function}
   */
  static skipDotsFilter(originalFilter) {
    return (file) => {
      let basename = path.basename(file);

      return basename !== '.'
          && basename !== '..'
          && (!originalFilter || originalFilter(file));
    };
  }

  /**
   * @returns {String}
   */
  static get RECURSIVE() {
    return 'recursive';
  }

  /**
   * @returns {String}
   */
  static get SIMPLE() {
    return 'simple';
  }
}
