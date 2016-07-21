/**
 * Created by AlexanderC on 6/1/15.
 */

/*eslint no-undefined: 0*/

'use strict';

import FileSystem from 'graceful-fs';
import FileSystemExtra from 'fs-extra';
import FS from 'fs';
import path from 'path';
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
   * @param {Object[]} args
   */
  remove(...args) {
    FileSystemExtra.removeSync(...args);
  }

  /**
   * @param {String} source
   * @param {String} destination
   * @param {Function} filter
   * @returns {FileWalker}
   */
  copy(source, destination, filter = () => true) {
    source = path.normalize(source);
    destination = path.normalize(destination);

    let skipDotFilter = FileWalker.skipDotsFilter(filter);
    let sourceOffset = source.length;

    let files = this.walk(source, skipDotFilter);

    for (let i in files) {
      if (!files.hasOwnProperty(i)) {
        continue;
      }

      let file = files[i];

      let relativePath = file.substring(sourceOffset);
      let fileCopy = path.join(destination, relativePath);
      let fileDir = path.dirname(fileCopy);

      if (!FS.existsSync(fileDir)) {
        this.mkdir(fileDir);
      }

      FileSystemExtra.copySync(file, fileCopy);
    }

    return this;
  }

  /**
   * @param {String} dir
   * @param {Function} filter
   * @param {Array} _readDirsCache
   * @returns {Array}
   */
  walk(dir, filter = () => true, _readDirsCache = []) {
    let results = [];
    let list = FileSystem.readdirSync(dir);
    let ignoreFilter = this._ignoreFile
      ? this._buildIgnoreFilter(dir)
      : () => true;

    list = list
      .map((file) => path.join(dir, file))
      .filter(ignoreFilter);

    for (let i in list) {
      if (!list.hasOwnProperty(i)) {
        continue;
      }

      let file = list[i];

      if (this._type === FileWalker.RECURSIVE) {
        let stat = null;

        try {
          stat = FileSystem.statSync(file);
        } catch (error) {

          // error codes:
          //    ELOOP - too many symbolic links encountered
          //    ENOENT - missing file
          //    EACCES - permission denied
          if (['ELOOP', 'ENOENT', 'EACCES'].indexOf(error.code) !== -1) {
            continue;
          }

          throw error;
        }

        if (stat.isDirectory()) {
          let realDir = FileSystem.realpathSync(file);

          // avoid cyclic inheritance
          if (_readDirsCache.indexOf(realDir) === -1) {
            _readDirsCache.push(realDir);

            results = results.concat(this.walk(file, filter, _readDirsCache));
          }
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
   * @param {Function|null} originalFilter
   * @param {String|*} extensions
   * @returns {Function}
   */
  static matchExtensionsFilter(originalFilter = null, ...extensions) {
    let extensionsPlain = extensions.join('|');
    let regex = new RegExp(`\\.(${extensionsPlain})$`, 'i');

    return (file) => {
      return regex.test(file) && (!originalFilter || originalFilter(file));
    };
  }

  /**
   * @param {Function|null} originalFilter
   * @returns {Function}
   */
  static skipDotsFilter(originalFilter = null) {
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
